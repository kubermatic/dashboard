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

package auth

import (
	"crypto/rand"
	"fmt"
	"net/http"

	"github.com/gorilla/securecookie"
	"golang.org/x/oauth2"

	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// OAuthState is the payload of the signed, HttpOnly cookie that is kept between the
// redirect to the OIDC provider and its callback in the authorization code flows.
type OAuthState struct {
	// State must match the state parameter of the callback to prevent Cross-site Request Forgery attack.
	State string
	// Nonce must match the nonce claim of the ID token to bind it to this authentication request.
	Nonce string
	// CodeVerifier is the PKCE verifier whose S256 challenge was sent to the OIDC provider.
	CodeVerifier string
}

// NewOAuthState returns random state and nonce values and a PKCE code verifier.
func NewOAuthState() OAuthState {
	return OAuthState{
		State:        rand.Text(),
		Nonce:        rand.Text(),
		CodeVerifier: oauth2.GenerateVerifier(),
	}
}

// SetOAuthStateCookie stores the given state in a signed cookie.
func SetOAuthStateCookie(w http.ResponseWriter, name, path string, value OAuthState, maxAge int, secureMode bool, secCookie *securecookie.SecureCookie) error {
	encoded, err := secCookie.Encode(name, value)
	if err != nil {
		return fmt.Errorf("the encode cookie failed: %w", err)
	}

	http.SetCookie(w, oauthStateCookie(name, encoded, path, maxAge, secureMode))
	return nil
}

// ClearOAuthStateCookie deletes the cookie set by SetOAuthStateCookie; it is one-time use.
func ClearOAuthStateCookie(w http.ResponseWriter, name, path string, secureMode bool) {
	http.SetCookie(w, oauthStateCookie(name, "", path, -1, secureMode))
}

func oauthStateCookie(name, value, path string, maxAge int, secureMode bool) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secureMode,
		SameSite: http.SameSiteLaxMode,
	}
}

// GetOAuthStateCookie reads and verifies the signed cookie set by SetOAuthStateCookie.
func GetOAuthStateCookie(r *http.Request, name string, secCookie *securecookie.SecureCookie) (OAuthState, error) {
	cookie, err := r.Cookie(name)
	if err != nil {
		return OAuthState{}, utilerrors.NewBadRequest("cookie %q not set: %v", name, err)
	}

	var value OAuthState
	if err := secCookie.Decode(name, cookie.Value, &value); err != nil {
		return OAuthState{}, utilerrors.NewBadRequest("incorrect value of %q cookie: %v", name, err)
	}
	return value, nil
}
