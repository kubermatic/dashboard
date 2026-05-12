/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package authflow

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/oauth2"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
)

const (
	// oauthStateCookieName is the short-lived encrypted cookie that carries the CSRF
	// state token, nonce, and PKCE code verifier across the login → OIDC → callback cycle.
	oauthStateCookieName   = "_oauth_state"
	oauthStateCookieMaxAge = 300 // 5 minutes
	callbackPath           = "/api/v2/auth/callback"
)

// oauthStateCookie is the payload stored in the encrypted _oauth_state cookie.
type oauthStateCookie struct {
	State        string
	Nonce        string
	CodeVerifier string
}

func randomURLSafeString(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// appendPKCEParams adds code_challenge and code_challenge_method to an auth URL.
func appendPKCEParams(authURL, codeChallenge string) string {
	return authURL + "&code_challenge=" + url.QueryEscape(codeChallenge) + "&code_challenge_method=S256"
}

// isLocalHost reports whether the request's host is a loopback address (localhost or 127.0.0.1).
func isLocalHost(r *http.Request) bool {
	host := r.Host
	if h, _, err := net.SplitHostPort(host); err == nil {
		host = h
	}
	return host == "localhost" || host == "127.0.0.1"
}

// requestScheme returns the scheme to use when deriving a URL from the request.
// Behind a TLS-terminating ingress r.TLS is nil, so this is only meaningful for
// loopback (local dev) where there's no proxy in front.
func requestScheme(r *http.Request) string {
	if r.TLS == nil {
		return "http"
	}
	return "https"
}

// schemeAndHost decides which scheme + host to use for an outbound URL.
// For loopback (local dev) it uses the request itself so the flow stays local.
// Otherwise it uses --oidc-issuer-redirect-uri, which carries the correct https
// scheme even behind TLS-terminating ingress where r.TLS is always nil.
// Falls back to the request if the redirect URI is missing or malformed.
func (a *authHandler) schemeAndHost(r *http.Request) (scheme, host string) {
	if isLocalHost(r) {
		return requestScheme(r), r.Host
	}
	if uri, err := a.oidcIssuerVerifier.GetRedirectURI(callbackPath); err == nil {
		if u, err := url.Parse(uri); err == nil && u.Host != "" {
			return u.Scheme, u.Host
		}
	}
	return requestScheme(r), r.Host
}

// getCallbackURI returns the full callback URL for the OIDC redirect.
func (a *authHandler) getCallbackURI(r *http.Request) string {
	scheme, host := a.schemeAndHost(r)
	return fmt.Sprintf("%s://%s%s", scheme, host, callbackPath)
}

func (a *authHandler) loginHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		oidcConfig := a.oidcIssuerVerifier.OIDCConfig()

		nonce, err := randomURLSafeString(32)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to generate nonce: %v", err), http.StatusInternalServerError)
			return
		}
		state, err := randomURLSafeString(32)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to generate state: %v", err), http.StatusInternalServerError)
			return
		}

		codeVerifier := oauth2.GenerateVerifier()

		// Encode state, nonce, and PKCE verifier into a single signed+encrypted cookie.
		encodedStateCookie, err := oidcConfig.SecureCookie.Encode(oauthStateCookieName, oauthStateCookie{
			State:        state,
			Nonce:        nonce,
			CodeVerifier: codeVerifier,
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to encode state cookie: %v", err), http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     oauthStateCookieName,
			Value:    encodedStateCookie,
			MaxAge:   oauthStateCookieMaxAge,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		scopes := []string{"openid", "email", "profile", "groups"}
		if oidcConfig.OfflineAccessAsScope {
			scopes = append(scopes, "offline_access")
		}

		redirectURI := a.getCallbackURI(r)
		authURL := a.oidcIssuerVerifier.AuthCodeURL(state, oidcConfig.OfflineAccessAsScope, redirectURI, scopes...)
		authURL = appendPKCEParams(authURL, oauth2.S256ChallengeFromVerifier(codeVerifier))
		authURL = authURL + "&nonce=" + url.QueryEscape(nonce)

		http.Redirect(w, r, authURL, http.StatusSeeOther)
	})
}

const (
	idTokenCookieName = "token"
	// Max characters per cookie (staying under the 4KB browser limit).
	maxCookieSize            = 3800
	refreshTokenCookieName   = "refresh_token"
	refreshTokenCookieMaxAge = 2592000 // 30 days
)

func (a *authHandler) callbackHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		oidcConfig := a.oidcIssuerVerifier.OIDCConfig()

		// 1. Extract state and code from query params.
		state := r.URL.Query().Get("state")
		code := r.URL.Query().Get("code")
		if state == "" || code == "" {
			http.Error(w, "missing state or code parameter", http.StatusBadRequest)
			return
		}

		// 2. Read and decode the _oauth_state cookie.
		stateCookie, err := r.Cookie(oauthStateCookieName)
		if err != nil {
			http.Error(w, "missing state cookie", http.StatusBadRequest)
			return
		}

		var storedState oauthStateCookie
		if err := oidcConfig.SecureCookie.Decode(oauthStateCookieName, stateCookie.Value, &storedState); err != nil {
			http.Error(w, fmt.Sprintf("failed to decode state cookie: %v", err), http.StatusBadRequest)
			return
		}

		// 3. CSRF check: the state param from the OIDC provider must match what we stored.
		if storedState.State != state {
			http.Error(w, "state mismatch", http.StatusBadRequest)
			return
		}

		// Clear the state cookie — it is one-time use.
		http.SetCookie(w, &http.Cookie{
			Name:     oauthStateCookieName,
			Value:    "",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		// 4. Exchange authorization code for tokens with PKCE code_verifier from the cookie.
		redirectURI := a.getCallbackURI(r)
		oidcTokens, err := a.oidcIssuerVerifier.Exchange(r.Context(), code, redirectURI, storedState.CodeVerifier)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to exchange code for tokens: %v", err), http.StatusInternalServerError)
			return
		}

		// 5. Verify id_token and check email claim.
		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), oidcTokens.IDToken)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to verify id_token: %v", err), http.StatusInternalServerError)
			return
		}

		// Validate the nonce claim binds the id_token to this auth request.
		if claims.Nonce != storedState.Nonce {
			http.Error(w, "nonce mismatch", http.StatusBadRequest)
			return
		}

		if claims.Email == "" {
			http.Error(w, "email claim is missing from id_token", http.StatusBadRequest)
			return
		}

		// 6. Set id_token cookie with Max-Age matching the token's expiry.
		tokenMaxAge := int(time.Until(claims.Expiry.Time).Seconds())
		if tokenMaxAge <= 0 {
			http.Error(w, "received an already expired id_token", http.StatusInternalServerError)
			return
		}

		clearAuthCookies(w, r, oidcConfig.CookieSecureMode)

		tokenValue := oidcTokens.IDToken
		if len(tokenValue) <= maxCookieSize {
			// Standard single cookie
			setNamedCookie(w, idTokenCookieName, tokenValue, "/", tokenMaxAge, oidcConfig.CookieSecureMode)
		} else {
			// Chunked cookies: token-1, token-2, etc.
			chunks := chunkString(tokenValue, maxCookieSize)
			for i, chunk := range chunks {
				setNamedCookie(w, fmt.Sprintf("%s-%d", idTokenCookieName, i+1), chunk, "/", tokenMaxAge, oidcConfig.CookieSecureMode)
			}
		}

		// 7. Set refresh_token cookie (if present).
		if oidcTokens.RefreshToken != "" {
			setNamedCookie(w, refreshTokenCookieName, oidcTokens.RefreshToken, "/api/v2/auth", refreshTokenCookieMaxAge, oidcConfig.CookieSecureMode)
		}

		// 8. Redirect to frontend landing page.
		userInfo, err := a.userProvider.UserByEmail(r.Context(), claims.Email)
		if err != nil {
			fmt.Println("failed to get user info", err)
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		landingPageURI := "/"

		if userInfo.Spec.Settings.SelectedProjectID != "" {
			projectID := userInfo.Spec.Settings.SelectedProjectID
			if userInfo.Spec.Settings.UseClustersView {
				landingPageURI = fmt.Sprintf("/projects/%s/clusters", projectID)
			} else {
				landingPageURI = fmt.Sprintf("/projects/%s/overview", projectID)
			}
		}
		http.Redirect(w, r, landingPageURI, http.StatusSeeOther)
	})
}

func (a *authHandler) refreshHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		oidcConfig := a.oidcIssuerVerifier.OIDCConfig()

		// 1. Read refresh_token from cookie.
		refreshCookie, err := r.Cookie(refreshTokenCookieName)
		if err != nil {
			clearAuthCookies(w, r, oidcConfig.CookieSecureMode)
			http.Error(w, "missing refresh_token cookie", http.StatusUnauthorized)
			return
		}

		// 2. Refresh tokens.
		oidcTokens, err := a.oidcIssuerVerifier.RefreshAccessToken(r.Context(), refreshCookie.Value)
		if err != nil {
			clearAuthCookies(w, r, oidcConfig.CookieSecureMode)
			http.Error(w, "token refresh failed", http.StatusUnauthorized)
			return
		}

		// 3. Verify new id_token.
		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), oidcTokens.IDToken)
		if err != nil {
			clearAuthCookies(w, r, oidcConfig.CookieSecureMode)
			http.Error(w, "failed to verify refreshed id_token", http.StatusUnauthorized)
			return
		}

		if claims.Email == "" {
			clearAuthCookies(w, r, oidcConfig.CookieSecureMode)
			http.Error(w, "email claim is missing from refreshed id_token", http.StatusUnauthorized)
			return
		}

		// 4. Set new id_token cookie with Max-Age matching the token's expiry.
		tokenMaxAge := int(time.Until(claims.Expiry.Time).Seconds())
		if tokenMaxAge <= 0 {
			clearAuthCookies(w, r, oidcConfig.CookieSecureMode)
			http.Error(w, "received an already expired id_token from refresh", http.StatusUnauthorized)
			return
		}

		clearAuthCookies(w, r, oidcConfig.CookieSecureMode)

		tokenValue := oidcTokens.IDToken
		if len(tokenValue) <= maxCookieSize {
			// Standard single cookie
			setNamedCookie(w, idTokenCookieName, tokenValue, "/", tokenMaxAge, oidcConfig.CookieSecureMode)
		} else {
			// Chunked cookies: token-1, token-2, etc.
			chunks := chunkString(tokenValue, maxCookieSize)
			for i, chunk := range chunks {
				setNamedCookie(w, fmt.Sprintf("%s-%d", idTokenCookieName, i+1), chunk, "/", tokenMaxAge, oidcConfig.CookieSecureMode)
			}
		}

		// 5. Set new refresh_token cookie (if rotated).
		if oidcTokens.RefreshToken != "" {
			setNamedCookie(w, refreshTokenCookieName, oidcTokens.RefreshToken, "/api/v2/auth", refreshTokenCookieMaxAge, oidcConfig.CookieSecureMode)
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(authStatusResponse{
			ExpiresAt: claims.Expiry.Unix(),
		}); err != nil {
			http.Error(w, fmt.Sprintf("failed to encode response: %v", err), http.StatusInternalServerError)
		}
	})
}

func setNamedCookie(w http.ResponseWriter, name, value, path string, maxAge int, secureMode bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
		Path:     path,
	})
}

func (a *authHandler) logoutHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenValue, err := a.tokenExtractor.Extract(r)
		if err != nil {
			http.Error(w, "missing token cookie", http.StatusUnauthorized)
			return
		}

		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), tokenValue)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to verify id_token: %v", err), http.StatusUnauthorized)
			return
		}

		if claims.Email == "" {
			http.Error(w, "email claim is missing from id_token", http.StatusInternalServerError)
			return
		}

		userInfo, err := a.userProvider.UserByEmail(r.Context(), claims.Email)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to get user info: %v", err), http.StatusInternalServerError)
			return
		}

		// check for oidcLogoutURL
		kubermaticConfig, err := a.kubermaticConfigProvider(r.Context())
		redirectPath := "/"

		if err != nil {
			fmt.Println("failed to get UI configurations", err)
		} else {
			redirectPath = getOIDCProviderLogoutURL(kubermaticConfig, tokenValue, a.getBaseURL(r))
		}

		if err := a.userProvider.InvalidateToken(r.Context(), userInfo, tokenValue, claims.Expiry); err != nil {
			http.Error(w, fmt.Sprintf("failed to invalidate token: %v", err), http.StatusInternalServerError)
			return
		}
		clearAuthCookies(w, r, a.oidcIssuerVerifier.OIDCConfig().CookieSecureMode)
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{
			"redirect": redirectPath,
		}); err != nil {
			http.Error(w, fmt.Sprintf("failed to encode response: %v", err), http.StatusInternalServerError)
		}
	})
}

func clearAuthCookies(w http.ResponseWriter, r *http.Request, secureMode bool) {
	clearNamedCookie(w, idTokenCookieName, "/", secureMode)
	clearNamedCookie(w, refreshTokenCookieName, "/api/v2/auth", secureMode)
	chunkPrefix := idTokenCookieName + "-"
	for _, c := range r.Cookies() {
		if strings.HasPrefix(c.Name, chunkPrefix) {
			clearNamedCookie(w, c.Name, "/", secureMode)
		}
	}
}

func clearNamedCookie(w http.ResponseWriter, name, path string, secureMode bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
		Path:     path,
	})
}

type authStatusResponse struct {
	ExpiresAt int64 `json:"expires_at"`
}

func (a *authHandler) statusHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenValue, err := a.tokenExtractor.Extract(r)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(authStatusResponse{
				ExpiresAt: 0,
			}); err != nil {
				http.Error(w, fmt.Sprintf("failed to encode response: %v", err), http.StatusInternalServerError)
			}
			return
		}

		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), tokenValue)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(authStatusResponse{
			ExpiresAt: claims.Expiry.Unix(),
		}); err != nil {
			http.Error(w, fmt.Sprintf("failed to encode response: %v", err), http.StatusInternalServerError)
		}
	})
}

func chunkString(token string, chunkSize int) []string {
	var chunks []string
	for i := 0; i < len(token); i += chunkSize {
		end := i + chunkSize
		if end > len(token) {
			end = len(token)
		}
		chunks = append(chunks, token[i:end])
	}
	return chunks
}

// getBaseURL returns the scheme+host used for logout redirect URIs.
func (a *authHandler) getBaseURL(r *http.Request) string {
	scheme, host := a.schemeAndHost(r)
	return fmt.Sprintf("%s://%s", scheme, host)
}

func getOIDCProviderLogoutURL(kubermaticConfig *kubermaticv1.KubermaticConfiguration, token, baseURL string) string {
	redirectPath := baseURL + "/"
	var uiConfig map[string]interface{}
	if kubermaticConfig.Spec.UI.Config != "" {
		err := json.Unmarshal([]byte(kubermaticConfig.Spec.UI.Config), &uiConfig)
		if err != nil {
			fmt.Println("failed to unmarshal UI configurations", err)
			return redirectPath
		}
	}
	if value, ok := uiConfig["oidc_logout_url"]; ok {
		if oidcLogoutURLStr, ok := value.(string); ok && oidcLogoutURLStr != "" {
			oidcLogoutURL, err := url.Parse(oidcLogoutURLStr)
			if err != nil {
				fmt.Println("failed to create the OIDC Logout URL from UI configurations", err)
				return redirectPath
			}
			oidcProvider, ok := uiConfig["oidc_provider"].(string)
			if !ok {
				fmt.Println("failed to get the OIDC Logout Provider from UI configurations")
				return redirectPath
			}
			urlQuery := oidcLogoutURL.Query()

			if strings.ToLower(oidcProvider) == "keycloak" {
				urlQuery.Set("post_logout_redirect_uri", redirectPath)
				urlQuery.Set("id_token_hint", token)
			} else {
				if urlQuery.Has("redirectUri") {
					urlQuery.Set("redirectUri", redirectPath)
				} else {
					urlQuery.Set("redirect_uri", redirectPath)
				}
			}
			oidcLogoutURL.RawQuery = urlQuery.Encode()
			return oidcLogoutURL.String()
		}
	}
	return redirectPath
}
