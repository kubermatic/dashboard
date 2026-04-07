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

package kubermaticdashboard

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	apimachineryrand "k8s.io/apimachinery/pkg/util/rand"
)

const (
	nonceCookieName   = "nonce"
	nonceCookieMaxAge = 180
	callbackPath      = "/api/v2/auth/callback"
)

const pkceVerifierLen = 64

// generateCodeVerifier creates a cryptographically random PKCE code verifier (RFC 7636).
func generateCodeVerifier() (string, error) {
	buf := make([]byte, pkceVerifierLen)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to generate code verifier: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// deriveCodeChallenge computes the S256 code challenge from a code verifier.
func deriveCodeChallenge(verifier string) string {
	hash := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}

// appendPKCEParams adds code_challenge and code_challenge_method to an auth URL.
func appendPKCEParams(authURL, codeChallenge string) string {
	return authURL + "&code_challenge=" + url.QueryEscape(codeChallenge) + "&code_challenge_method=S256"
}

// buildRedirectURI constructs the callback URL from the incoming request's host.
func buildRedirectURI(r *http.Request) string {
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	return fmt.Sprintf("%s://%s%s", scheme, r.Host, callbackPath)
}

func (a *authHandler) loginHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		oidcConfig := a.oidcIssuerVerifier.OIDCConfig()

		nonce := apimachineryrand.String(apimachineryrand.IntnRange(10, 15))
		state := apimachineryrand.String(apimachineryrand.IntnRange(10, 15))

		codeVerifier, err := generateCodeVerifier()
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to generate PKCE code verifier: %v", err), http.StatusInternalServerError)
			return
		}

		a.stateStore.Store(state, authtypes.AuthState{
			Nonce:        nonce,
			CodeVerifier: codeVerifier,
			CreatedAt:    time.Now(),
		})

		scopes := []string{"openid", "email", "profile", "groups"}
		if oidcConfig.OfflineAccessAsScope {
			scopes = append(scopes, "offline_access")
		}

		redirectURI := buildRedirectURI(r)
		authURL := a.oidcIssuerVerifier.AuthCodeURL(state, oidcConfig.OfflineAccessAsScope, redirectURI, scopes...)
		authURL = appendPKCEParams(authURL, deriveCodeChallenge(codeVerifier))

		encodedNonce, err := oidcConfig.SecureCookie.Encode(nonceCookieName, nonce)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to encode nonce cookie: %v", err), http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     nonceCookieName,
			Value:    encodedNonce,
			MaxAge:   nonceCookieMaxAge,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
		})

		http.Redirect(w, r, authURL, http.StatusSeeOther)
	})
}

const (
	idTokenCookieName = "token"
	// Max characters per cookie (staying under the 4KB browser limit)
	maxCookieSize = 3800
	// The maximum number of "slots" to check or clear (safety margin)
	maxNumOfTokenCookies     = 6
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

		// 2. Look up nonce from state store and delete (one-time use).
		authState, ok := a.stateStore.Get(state)
		if !ok {
			http.Error(w, "invalid or expired state parameter", http.StatusBadRequest)
			return
		}
		a.stateStore.Delete(state)

		// 3. Read and validate nonce cookie.
		nonceCookie, err := r.Cookie(nonceCookieName)
		if err != nil {
			http.Error(w, "missing nonce cookie", http.StatusBadRequest)
			return
		}

		var decodedNonce string
		if err := oidcConfig.SecureCookie.Decode(nonceCookieName, nonceCookie.Value, &decodedNonce); err != nil {
			http.Error(w, fmt.Sprintf("failed to decode nonce cookie: %v", err), http.StatusBadRequest)
			return
		}

		if decodedNonce != authState.Nonce {
			http.Error(w, "nonce mismatch", http.StatusBadRequest)
			return
		}

		// 4. Exchange authorization code for tokens with PKCE code_verifier.
		redirectURI := buildRedirectURI(r)
		oidcTokens, err := a.oidcIssuerVerifier.Exchange(r.Context(), code, redirectURI, authState.CodeVerifier)
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

		clearAuthCookies(w, oidcConfig.CookieSecureMode)

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

		// 8. Clear nonce cookie.
		http.SetCookie(w, &http.Cookie{
			Name:     nonceCookieName,
			Value:    "",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
		})

		// 9. Redirect to frontend landing page.
		userInfo, err := a.userProvider.UserByEmail(r.Context(), claims.Email)
		if err != nil {
			fmt.Println("faild to get user info", err)
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
			clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "missing refresh_token cookie", http.StatusUnauthorized)
			return
		}

		// 2. Refresh tokens.
		oidcTokens, err := a.oidcIssuerVerifier.RefreshAccessToken(r.Context(), refreshCookie.Value)
		if err != nil {
			clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "token refresh failed", http.StatusUnauthorized)
			return
		}

		// 3. Verify new id_token.
		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), oidcTokens.IDToken)
		if err != nil {
			clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "failed to verify refreshed id_token", http.StatusUnauthorized)
			return
		}

		if claims.Email == "" {
			clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "email claim is missing from refreshed id_token", http.StatusUnauthorized)
			return
		}

		// 4. Set new id_token cookie with Max-Age matching the token's expiry.
		tokenMaxAge := int(time.Until(claims.Expiry.Time).Seconds())
		if tokenMaxAge <= 0 {
			clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "received an already expired id_token from refresh", http.StatusUnauthorized)
			return
		}

		clearAuthCookies(w, oidcConfig.CookieSecureMode)

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

		w.WriteHeader(http.StatusOK)
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
			http.Error(w, "missing token cookie", http.StatusBadRequest)
			return
		}

		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), tokenValue)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to verify id_token: %v", err), http.StatusInternalServerError)
			return
		}

		if claims.Email == "" {
			http.Error(w, "email claim is missing from id_token", http.StatusInternalServerError)
			return
		}

		userInfo, err := a.userProvider.UserByEmail(r.Context(), claims.Email)
		if err != nil {
			http.Error(w, fmt.Sprintf("faild to get user info: %v", err), http.StatusInternalServerError)
			return
		}

		// check for oidcLogoutURL
		kubermaticConfig, err := a.kubermaticConfigProvider(r.Context())
		redirectPath := "/"

		if err != nil {
			fmt.Println("faild to get UI configurations", err)
		} else {
			redirectPath = getOIDCProviderLogoutURL(kubermaticConfig, tokenValue, buildBaseURL(r))
		}

		a.userProvider.InvalidateToken(r.Context(), userInfo, tokenValue, claims.Expiry)
		clearAuthCookies(w, a.oidcIssuerVerifier.OIDCConfig().CookieSecureMode)
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{
			"redirect": redirectPath,
		}); err != nil {
			http.Error(w, fmt.Sprintf("failed to encode response: %v", err), http.StatusInternalServerError)
		}

	})
}

func clearAuthCookies(w http.ResponseWriter, secureMode bool) {
	clearNamedCookie(w, idTokenCookieName, "/", secureMode)
	clearNamedCookie(w, refreshTokenCookieName, "/api/v2/auth", secureMode)
	// Clear potential chunks (token-1, token-2, etc.)
	for i := range maxNumOfTokenCookies {
		chunkName := fmt.Sprintf("%s-%d", idTokenCookieName, i+1)
		clearNamedCookie(w, chunkName, "/", secureMode)
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
			fmt.Println("token is requiered to get the status")
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

// buildBaseURL constructs the base URL (scheme + host) from the incoming request.
func buildBaseURL(r *http.Request) string {
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	return fmt.Sprintf("%s://%s", scheme, r.Host)
}

func getOIDCProviderLogoutURL(kubermaticConfig *kubermaticv1.KubermaticConfiguration, token, baseURL string) string {
	redirectPath := baseURL + "/"
	var uiConfig map[string]interface{}
	if kubermaticConfig.Spec.UI.Config != "" {
		err := json.Unmarshal([]byte(kubermaticConfig.Spec.UI.Config), &uiConfig)
		if err != nil {
			fmt.Println("faild to unmarshal UI configurations", err)
			return redirectPath
		}
	}
	if value, ok := uiConfig["oidc_logout_url"]; ok {
		if oidcLogoutURLStr, ok := value.(string); ok && oidcLogoutURLStr != "" {
			oidcLogoutURL, err := url.Parse(oidcLogoutURLStr)
			if err != nil {
				fmt.Println("faild to create the OIDC Logout URL from UI configurations", err)
				return redirectPath
			}
			provider := ""
			if oidcProvider, ok := uiConfig["oidc_provider"].(string); ok {
				provider = strings.ToLower(oidcProvider)
			} else {
				fmt.Println("faild to get the OIDC Logout Provider from UI configurations", err)
				return redirectPath
			}
			urlQuery := oidcLogoutURL.Query()

			if provider == "keycloak" {
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
