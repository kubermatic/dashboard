package types

import (
	"context"
	"net/http"
	"time"

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
