/*
Copyright 2023 The Kubermatic Kubernetes Platform contributors.

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

package types

import (
	"context"
	"net/http"
	"time"

	"github.com/gorilla/securecookie"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
)

// OIDCIssuerVerifier combines OIDCIssuer and TokenVerifier.
type OIDCIssuerVerifier interface {
	OIDCIssuer
	TokenExtractorVerifier
	RedirectURIPathGetter
}

type RedirectURIPathGetter interface {
	// GetRedirectURI gets redirect URI for a given path
	GetRedirectURI(path string) (string, error)
}

// OIDCIssuer exposes methods for getting OIDC tokens.
type OIDCIssuer interface {
	// AuthCodeURL returns a URL to OpenID provider's consent page
	// that asks for permissions for the required scopes explicitly.
	//
	// state is a token to protect the user from CSRF attacks. You must
	// always provide a non-zero string and validate that it matches the
	// the state query parameter on your redirect callback.
	// See http://tools.ietf.org/html/rfc6749#section-10.12 for more info.
	AuthCodeURL(state string, offlineAsScope bool, overwriteRedirectURI string, scopes ...string) string

	// Exchange converts an authorization code into a token.
	Exchange(ctx context.Context, code, overwriteRedirectURI string) (OIDCToken, error)

	// RefreshAccessToken uses a refresh token to obtain a new OIDC token.
	RefreshAccessToken(ctx context.Context, refreshToken string) (OIDCToken, error)

	// OIDCConfig returns the issuers OIDC config
	OIDCConfig() *OIDCConfiguration
}

// TokenVerifier knows how to verify a token.
type TokenVerifier interface {
	// Verify parses a raw ID Token, verifies it's been signed by the provider, performs
	// any additional checks depending on the Config, and returns the payload as TokenClaims.
	Verify(ctx context.Context, token string) (TokenClaims, error)
}

// TokenExtractorVerifier combines TokenVerifier and TokenExtractor interfaces.
type TokenExtractorVerifier interface {
	TokenVerifier
	TokenExtractor
}

// TokenExtractor is an interface that knows how to extract a token.
type TokenExtractor interface {
	// Extract gets a token from the given HTTP request
	Extract(r *http.Request) (string, error)
}

// OIDCToken represents the credentials used to authorize
// the requests to access protected resources on the OAuth 2.0
// provider's backend.
type OIDCToken struct {
	// AccessToken is the token that authorizes and authenticates
	// the requests.
	AccessToken string

	// RefreshToken is a token that's used by the application
	// (as opposed to the user) to refresh the access token
	// if it expires.
	RefreshToken string

	// Expiry is the optional expiration time of the access token.
	//
	// If zero, TokenSource implementations will reuse the same
	// token forever and RefreshToken or equivalent
	// mechanisms for that TokenSource will not be used.
	Expiry time.Time

	// IDToken is the token that contains claims about authenticated user
	//
	// Users should use TokenVerifier.Verify method to verify and extract claim from the token
	IDToken string
}

// TokenClaims holds various claims extracted from the id_token.
type TokenClaims struct {
	Name    string
	Email   string
	Subject string
	Groups  []string
	Expiry  apiv1.Time
}

// OIDCConfiguration is a struct that holds
// OIDC provider configuration data, read from command line arguments.
type OIDCConfiguration struct {
	// URL holds OIDC Issuer URL address
	URL string
	// ClientID holds OIDC ClientID
	ClientID string
	// ClientSecret holds OIDC ClientSecret
	ClientSecret string
	// SecureCookie encodes and decodes authenticated and optionally encrypted
	// cookie values.
	SecureCookie *securecookie.SecureCookie
	// CookieSecureMode if true then cookie received only with HTTPS otherwise with HTTP.
	CookieSecureMode bool
	// OfflineAccessAsScope if true then "offline_access" scope will be used
	// otherwise 'access_type=offline" query param will be passed
	OfflineAccessAsScope bool
	// SkipTLSVerify skip TLS verification for the token issuer
	SkipTLSVerify bool
}
