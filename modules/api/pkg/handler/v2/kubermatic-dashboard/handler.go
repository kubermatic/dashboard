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
	"time"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"

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
	idTokenCookieName        = "token"
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
		http.SetCookie(w, &http.Cookie{
			Name:     idTokenCookieName,
			Value:    oidcTokens.IDToken,
			MaxAge:   tokenMaxAge,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		// 7. Set refresh_token cookie (if present).
		if oidcTokens.RefreshToken != "" {
			http.SetCookie(w, &http.Cookie{
				Name:     refreshTokenCookieName,
				Value:    oidcTokens.RefreshToken,
				MaxAge:   refreshTokenCookieMaxAge,
				HttpOnly: true,
				Secure:   oidcConfig.CookieSecureMode,
				SameSite: http.SameSiteLaxMode,
				Path:     "/api/v2/auth",
			})
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

		// 9. Redirect to frontend root.
		http.Redirect(w, r, "/", http.StatusSeeOther)
	})
}

func (a *authHandler) refreshHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		oidcConfig := a.oidcIssuerVerifier.OIDCConfig()

		// 1. Read refresh_token from cookie.
		refreshCookie, err := r.Cookie(refreshTokenCookieName)
		if err != nil {
			a.clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "missing refresh_token cookie", http.StatusUnauthorized)
			return
		}

		// 2. Refresh tokens.
		oidcTokens, err := a.oidcIssuerVerifier.RefreshAccessToken(r.Context(), refreshCookie.Value)
		if err != nil {
			a.clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "token refresh failed", http.StatusUnauthorized)
			return
		}

		// 3. Verify new id_token.
		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), oidcTokens.IDToken)
		if err != nil {
			a.clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "failed to verify refreshed id_token", http.StatusUnauthorized)
			return
		}

		if claims.Email == "" {
			a.clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "email claim is missing from refreshed id_token", http.StatusUnauthorized)
			return
		}

		// 4. Set new id_token cookie with Max-Age matching the token's expiry.
		tokenMaxAge := int(time.Until(claims.Expiry.Time).Seconds())
		if tokenMaxAge <= 0 {
			a.clearAuthCookies(w, oidcConfig.CookieSecureMode)
			http.Error(w, "received an already expired id_token from refresh", http.StatusUnauthorized)
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name:     idTokenCookieName,
			Value:    oidcTokens.IDToken,
			MaxAge:   tokenMaxAge,
			HttpOnly: true,
			Secure:   oidcConfig.CookieSecureMode,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		// 5. Set new refresh_token cookie (if rotated).
		if oidcTokens.RefreshToken != "" {
			http.SetCookie(w, &http.Cookie{
				Name:     refreshTokenCookieName,
				Value:    oidcTokens.RefreshToken,
				MaxAge:   refreshTokenCookieMaxAge,
				HttpOnly: true,
				Secure:   oidcConfig.CookieSecureMode,
				SameSite: http.SameSiteLaxMode,
				Path:     "/api/v2/auth",
			})
		}

		w.WriteHeader(http.StatusOK)
	})
}

// clearAuthCookies removes both auth cookies.
func (a *authHandler) clearAuthCookies(w http.ResponseWriter, secureMode bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     idTokenCookieName,
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})
	http.SetCookie(w, &http.Cookie{
		Name:     refreshTokenCookieName,
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/v2/auth",
	})
}

func (a *authHandler) logoutHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.clearAuthCookies(w, a.oidcIssuerVerifier.OIDCConfig().CookieSecureMode)
		w.WriteHeader(http.StatusOK)
	})
}

type authStatusResponse struct {
	ExpiresAt int64 `json:"expires_at"`
}

func (a *authHandler) statusHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenCookie, err := r.Cookie(idTokenCookieName)
		if err != nil {
			http.Error(w, "not authenticated", http.StatusUnauthorized)
			return
		}

		claims, err := a.oidcIssuerVerifier.Verify(r.Context(), tokenCookie.Value)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(authStatusResponse{
			ExpiresAt: claims.Expiry.Unix(),
		})
	})
}
