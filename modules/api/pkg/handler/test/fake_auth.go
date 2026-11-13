/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

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

package test

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"

	"github.com/gorilla/securecookie"
	"golang.org/x/oauth2"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	handlerauth "k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

const (
	// AuthorizationCode represents a shared secret used by IssuerVerifier
	// TODO: consider injecting it into IssuerVerifier.
	AuthorizationCode = "fakeCode"
	// IDToken represents a shared fake token.
	IDToken       = "fakeTokenId"
	IDViewerToken = "fakeViewerTokenId"
	refreshToken  = "fakeRefreshToken"
	tokenURL      = "url:tokenURL"

	// IssuerURL holds test issuer URL.
	IssuerURL = "url://dex"
	// IssuerClientID holds test issuer client ID.
	IssuerClientID = "kubermatic"
	// IssuerClientSecret holds test issuer client secret.
	IssuerClientSecret = "secret"
	issuerRedirectURL  = "/api/v1/kubeconfig"
)

// fakeSecureCookie signs the OIDC cookies; the hash key must be non-empty, otherwise encoding fails.
var fakeSecureCookie = securecookie.New([]byte("fake-secure-cookie-hash-key"), nil)

var _ authtypes.OIDCIssuerVerifier = &IssuerVerifier{}
var _ authtypes.TokenExtractorVerifier = &IssuerVerifier{}

// OicdProvider is a test stub that mocks *oidc.Provider.
type OicdProvider struct {
	authURL  string
	tokenURL string
}

// NewFakeOIDCClient returns fake OIDC issuer and verifier.
func NewFakeOIDCClient(user apiv1.User) *IssuerVerifier {
	return &IssuerVerifier{
		user:         user,
		issuer:       IssuerURL,
		clientID:     IssuerClientID,
		clientSecret: IssuerClientSecret,
		redirectURI:  issuerRedirectURL,
		provider: &OicdProvider{
			authURL:  IssuerURL,
			tokenURL: tokenURL,
		},
	}
}

// Endpoint returns the OAuth2 auth and token endpoints for the given provider.
func (p *OicdProvider) Endpoint() oauth2.Endpoint {
	return oauth2.Endpoint{AuthURL: p.authURL, TokenURL: p.tokenURL}
}

// IssuerVerifier is a test stub that mocks OIDC responses.
type IssuerVerifier struct {
	user         apiv1.User
	issuer       string
	clientID     string
	clientSecret string
	redirectURI  string
	provider     *OicdProvider

	// codeChallenge and nonce hold the values of the last AuthCodeURL call, so that
	// Exchange can verify the code_verifier and Verify can return the nonce claim like a real provider.
	lock          sync.Mutex
	codeChallenge string
	nonce         string
	// nonceClaimOverride, when set, is returned as nonce claim instead of the requested nonce.
	nonceClaimOverride string
	// emailVerifiedClaim, when set, is returned as email_verified claim.
	emailVerifiedClaim *bool
	// authRedirectURI is the redirect_uri of the last AuthCodeURL call, which Exchange must repeat.
	authRedirectURI        string
	additionalRedirectURIs []string
}

// SetRedirectURI sets the configured redirect URI, like -oidc-issuer-redirect-uri.
func (o *IssuerVerifier) SetRedirectURI(uri string) {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.redirectURI = uri
}

// SetAdditionalRedirectURIs sets the additional redirect URIs, like -oidc-issuer-additional-redirect-uris.
func (o *IssuerVerifier) SetAdditionalRedirectURIs(uris ...string) {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.additionalRedirectURIs = uris
}

// SetNonceClaim makes Verify return the given nonce claim, simulating an ID token
// that was issued for a different authentication request.
func (o *IssuerVerifier) SetNonceClaim(nonce string) {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.nonceClaimOverride = nonce
}

// SetEmailVerifiedClaim makes Verify return the given email_verified claim. Without it the
// token has no such claim.
func (o *IssuerVerifier) SetEmailVerifiedClaim(emailVerified bool) {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.emailVerifiedClaim = &emailVerified
}

// Extractor knows how to extract the ID token from the request.
func (o *IssuerVerifier) Extract(_ *http.Request) (string, error) {
	return IDToken, nil
}

func (o *IssuerVerifier) GetRedirectURI(path string) (string, error) {
	u, err := url.Parse(o.redirectURI)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s://%s%s", u.Scheme, u.Host, path), nil
}

// AuthCodeURL returns a URL to OpenID provider's consent page.
func (o *IssuerVerifier) AuthCodeURL(state string, offlineAsScope bool, overwriteRedirectURI, codeVerifier, nonce string, scopes ...string) string {
	oauth2Config := o.oauth2Config(overwriteRedirectURI, scopes...)
	opts := []oauth2.AuthCodeOption{oauth2.AccessTypeOnline}
	if !offlineAsScope {
		opts = []oauth2.AuthCodeOption{oauth2.AccessTypeOffline}
	}

	o.lock.Lock()
	defer o.lock.Unlock()
	o.codeChallenge = ""
	if codeVerifier != "" {
		o.codeChallenge = oauth2.S256ChallengeFromVerifier(codeVerifier)
		opts = append(opts, oauth2.S256ChallengeOption(codeVerifier))
	}
	o.nonce = nonce
	o.authRedirectURI = oauth2Config.RedirectURL
	if nonce != "" {
		opts = append(opts, oauth2.SetAuthURLParam("nonce", nonce))
	}
	return oauth2Config.AuthCodeURL(state, opts...)
}

// oauth2Config return a oauth2Config.
func (o *IssuerVerifier) oauth2Config(overwriteRedirectURI string, scopes ...string) *oauth2.Config {
	redirectURI := o.redirectURI
	if overwriteRedirectURI != "" {
		redirectURI = overwriteRedirectURI
	}

	return &oauth2.Config{
		ClientID:     o.clientID,
		ClientSecret: o.clientSecret,
		Endpoint:     o.provider.Endpoint(),
		Scopes:       scopes,
		RedirectURL:  redirectURI,
	}
}

// Exchange converts an authorization code into a token.
func (o *IssuerVerifier) Exchange(ctx context.Context, code, overwriteRedirectURI string, codeVerifier ...string) (authtypes.OIDCToken, error) {
	if code != AuthorizationCode {
		return authtypes.OIDCToken{}, errors.New("incorrect code")
	}

	// Enforce PKCE like an OIDC provider configured with "PKCE Code Challenge Method: S256".
	var verifier string
	if len(codeVerifier) > 0 {
		verifier = codeVerifier[0]
	}
	o.lock.Lock()
	challenge := o.codeChallenge
	authRedirectURI := o.authRedirectURI
	redirectURI := o.oauth2Config(overwriteRedirectURI).RedirectURL
	o.lock.Unlock()
	if verifier == "" || oauth2.S256ChallengeFromVerifier(verifier) != challenge {
		return authtypes.OIDCToken{}, errors.New("invalid PKCE code_verifier")
	}

	// like a real provider, the token request must repeat the redirect_uri of the authorization request
	if redirectURI != authRedirectURI {
		return authtypes.OIDCToken{}, fmt.Errorf("redirect_uri %q does not match %q of the authorization request", redirectURI, authRedirectURI)
	}

	return authtypes.OIDCToken{
		IDToken:      IDToken,
		RefreshToken: refreshToken,
	}, nil
}

// RefreshAccessToken simulates refreshing an access token.
func (o *IssuerVerifier) RefreshAccessToken(ctx context.Context, refToken string) (authtypes.OIDCToken, error) {
	if refToken != refreshToken {
		return authtypes.OIDCToken{}, errors.New("invalid refresh token")
	}

	return authtypes.OIDCToken{
		IDToken:      IDToken,
		RefreshToken: refreshToken,
	}, nil
}

// Verify parses a raw ID Token, verifies it's been signed by the provider, performs
// any additional checks depending on the Config, and returns the payload as TokenClaims.
func (o *IssuerVerifier) Verify(ctx context.Context, token string) (authtypes.TokenClaims, error) {
	if o == nil {
		return authtypes.TokenClaims{}, nil
	}
	if ctx == nil {
		return authtypes.TokenClaims{}, nil
	}
	if token != IDToken {
		return authtypes.TokenClaims{}, errors.New("incorrect code")
	}
	o.lock.Lock()
	nonce := o.nonce
	if o.nonceClaimOverride != "" {
		nonce = o.nonceClaimOverride
	}
	emailVerified := o.emailVerifiedClaim
	o.lock.Unlock()
	return authtypes.TokenClaims{
		Email:         o.user.Email,
		EmailVerified: emailVerified,
		Subject:       o.user.Email,
		Name:          o.user.Name,
		Groups:        []string{},
		Nonce:         nonce,
	}, nil
}

func (o *IssuerVerifier) OIDCConfig() *authtypes.OIDCConfiguration {
	return &authtypes.OIDCConfiguration{
		URL:          o.issuer,
		ClientID:     o.clientID,
		ClientSecret: o.clientSecret,
		SecureCookie: fakeSecureCookie,
		// for tests of reverse proxies on other hostnames
		AdditionalRedirectURIs: o.additionalRedirectURIs,
	}
}

// GetCookie returns the cookie with the given name, or nil.
func GetCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, cookie := range cookies {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}

// WithoutStoredRedirectURI re-signs an OAuth state cookie without RedirectURI, like a cookie issued
// before the redirect URI was stored in it.
func WithoutStoredRedirectURI(cookie *http.Cookie) (*http.Cookie, error) {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	req.AddCookie(cookie)
	state, err := handlerauth.GetOAuthStateCookie(req, cookie.Name, fakeSecureCookie)
	if err != nil {
		return nil, err
	}
	state.RedirectURI = ""

	res := httptest.NewRecorder()
	if err := handlerauth.SetOAuthStateCookie(res, cookie.Name, cookie.Path, state, cookie.MaxAge, cookie.Secure, fakeSecureCookie); err != nil {
		return nil, err
	}
	return GetCookie(res.Result().Cookies(), cookie.Name), nil
}
