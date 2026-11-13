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

package auth

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/go-oidc"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"

	"k8s.io/apimachinery/pkg/util/sets"
)

// OpenIDClient implements OIDCIssuerVerifier and TokenExtractorVerifier.
type OpenIDClient struct {
	oidcConfig     *authtypes.OIDCConfiguration
	tokenExtractor authtypes.TokenExtractor
	redirectURI    string
	verifier       *oidc.IDTokenVerifier
	provider       *oidc.Provider
	httpClient     *http.Client
	deniedAudience DeniedAudienceFunc
	log            *zap.SugaredLogger
}

// DeniedAudienceFunc returns the client IDs that must not appear in the audience of an ID token.
type DeniedAudienceFunc func(ctx context.Context) (sets.Set[string], error)

// OpenIDClientOption configures an OpenIDClient.
type OpenIDClientOption func(*OpenIDClient)

// WithDeniedAudience makes Verify check ID tokens with more than one audience: their azp claim must be our
// client ID and their audience must not list one of the client IDs returned by denied. Verify fails if denied
// returns an error; the error is logged to log and not returned to the caller.
func WithDeniedAudience(denied DeniedAudienceFunc, log *zap.SugaredLogger) OpenIDClientOption {
	return func(o *OpenIDClient) {
		o.deniedAudience = denied
		if log != nil {
			o.log = log
		}
	}
}

// NewOpenIDClient returns an authentication middleware which authenticates against an openID server.
// If rootCertificates is nil, the host's root CAs will be used.
func NewOpenIDClient(
	oidcConfig *authtypes.OIDCConfiguration,
	redirectURI string,
	extractor authtypes.TokenExtractor,
	rootCertificates *x509.CertPool,
	opts ...OpenIDClientOption,
) (authtypes.OIDCIssuerVerifier, error) {
	ctx := context.Background()
	tr := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
			DualStack: true, //nolint:staticcheck // no-op since Go 1.12, fast fallback is the default
		}).DialContext,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		TLSClientConfig: &tls.Config{
			RootCAs:            rootCertificates,
			InsecureSkipVerify: oidcConfig.SkipTLSVerify,
		},
	}
	client := &http.Client{Transport: tr}

	p, err := oidc.NewProvider(context.WithValue(ctx, oauth2.HTTPClient, client), oidcConfig.URL)
	if err != nil {
		return nil, err
	}

	o := &OpenIDClient{
		tokenExtractor: extractor,
		redirectURI:    redirectURI,
		verifier:       p.Verifier(&oidc.Config{ClientID: oidcConfig.ClientID}),
		provider:       p,
		httpClient:     client,
		oidcConfig:     oidcConfig,
		log:            zap.NewNop().Sugar(),
	}
	for _, opt := range opts {
		opt(o)
	}

	return o, nil
}

// Extract knows how to extract the ID token from the request.
func (o *OpenIDClient) Extract(rq *http.Request) (string, error) {
	return o.tokenExtractor.Extract(rq)
}

// Verify parses a raw ID Token, verifies it's been signed by the provider, performs
// any additional checks depending on the Config, and returns the payload as TokenClaims.
func (o *OpenIDClient) Verify(ctx context.Context, token string) (authtypes.TokenClaims, error) {
	if token == "" {
		return authtypes.TokenClaims{}, errors.New("token cannot be empty")
	}

	idToken, err := o.verifier.Verify(ctx, token)
	if err != nil {
		if strings.Contains(err.Error(), "oidc: token is expired") {
			return authtypes.TokenClaims{}, &TokenExpiredError{msg: err.Error()}
		}
		return authtypes.TokenClaims{}, err
	}

	claims := map[string]interface{}{}
	err = idToken.Claims(&claims)
	if err != nil {
		return authtypes.TokenClaims{}, err
	}

	if err := o.verifyAudience(ctx, idToken.Audience, claims["azp"]); err != nil {
		return authtypes.TokenClaims{}, err
	}

	oidcClaims := authtypes.TokenClaims{}
	if rawName, found := claims["name"]; found {
		oidcClaims.Name = rawName.(string)
	}
	if rawEmail, found := claims["email"]; found {
		oidcClaims.Email = rawEmail.(string)
	}
	// kube-apiserver rejects a token whose email_verified claim is present and anything but
	// true, so a value that is not a boolean counts as not verified
	if rawEmailVerified, found := claims["email_verified"]; found {
		emailVerified, _ := rawEmailVerified.(bool)
		oidcClaims.EmailVerified = &emailVerified
	}
	if rawSub, found := claims["sub"]; found {
		oidcClaims.Subject = rawSub.(string)
	}
	if rawGroups, found := claims["groups"]; found {
		for _, rawGroup := range rawGroups.([]interface{}) {
			if group, ok := rawGroup.(string); ok {
				oidcClaims.Groups = append(oidcClaims.Groups, group)
			}
		}
	}
	if rawNonce, found := claims["nonce"]; found {
		if nonce, ok := rawNonce.(string); ok {
			oidcClaims.Nonce = nonce
		}
	}
	if rawExp, found := claims["exp"]; found {
		exp := rawExp.(float64)
		secs := int64(exp)
		nsecs := int64((exp - float64(secs)) * 1e9)
		oidcClaims.Expiry = apiv1.NewTime(time.Unix(secs, nsecs))
	}

	return oidcClaims, nil
}

// verifyAudience checks ID tokens with more than one audience. go-oidc only checks that our client ID is among
// the audiences. OIDC Core 3.1.3.7 says to reject tokens with additional audiences the client does not trust, and,
// when an extension such as Dex cross-client trust adds the azp claim, that the client SHOULD check azp is its own
// client ID. We go further and require azp on every token with several audiences, so only tokens issued to us are
// accepted. The untrusted audiences are the User Cluster clients: a token issued for both could be replayed against
// User Clusters.
func (o *OpenIDClient) verifyAudience(ctx context.Context, audience []string, azp interface{}) error {
	// go-oidc already made sure our client ID is in the audience, so a single entry is always our own.
	if o.deniedAudience == nil || len(audience) < 2 {
		return nil
	}

	clientID := o.oidcConfig.ClientID
	switch azp := azp.(type) {
	case nil:
		return fmt.Errorf("oidc: the token has several audiences but no azp claim, expected %q", clientID)
	case string:
		if azp != clientID {
			return fmt.Errorf("oidc: the token was issued to %q, not to %q", azp, clientID)
		}
	default:
		return fmt.Errorf("oidc: the token has an invalid azp claim, expected %q", clientID)
	}

	denied, err := o.deniedAudience(ctx)
	if err != nil {
		o.log.Errorw("failed to get the denied token audiences", zap.Error(err))
		return errors.New("failed to verify the token audience")
	}

	for _, aud := range audience {
		if aud != clientID && denied.Has(aud) {
			return fmt.Errorf("oidc: the token lists the User Cluster OIDC client %q in its audience", aud)
		}
	}

	return nil
}

// AuthCodeURL returns a URL to OpenID provider's consent page
// that asks for permissions for the required scopes explicitly.
//
// State is a token to protect the user from CSRF attacks. You must
// always provide a non-zero string and validate that it matches the
// the state query parameter on your redirect callback.
// See http://tools.ietf.org/html/rfc6749#section-10.12 for more info.
func (o *OpenIDClient) AuthCodeURL(state string, offlineAsScope bool, overwriteRedirectURI, codeVerifier, nonce string, scopes ...string) string {
	oauth2Config := o.oauth2Config(overwriteRedirectURI, scopes...)
	opts := []oauth2.AuthCodeOption{oauth2.AccessTypeOnline}
	if !offlineAsScope {
		opts = []oauth2.AuthCodeOption{oauth2.AccessTypeOffline}
	}
	if codeVerifier != "" {
		opts = append(opts, oauth2.S256ChallengeOption(codeVerifier))
	}
	if nonce != "" {
		opts = append(opts, oidc.Nonce(nonce))
	}
	return oauth2Config.AuthCodeURL(state, opts...)
}

// Exchange converts an authorization code into a token.
// An optional codeVerifier can be passed for PKCE support.
func (o *OpenIDClient) Exchange(ctx context.Context, code, overwriteRedirectURI string, codeVerifier ...string) (authtypes.OIDCToken, error) {
	clientCtx := oidc.ClientContext(ctx, o.httpClient)
	oauth2Config := o.oauth2Config(overwriteRedirectURI)

	var opts []oauth2.AuthCodeOption
	if len(codeVerifier) > 0 && codeVerifier[0] != "" {
		opts = append(opts, oauth2.VerifierOption(codeVerifier[0]))
	}

	tokens, err := oauth2Config.Exchange(clientCtx, code, opts...)
	if err != nil {
		return authtypes.OIDCToken{}, err
	}

	oidcToken := authtypes.OIDCToken{AccessToken: tokens.AccessToken, RefreshToken: tokens.RefreshToken, Expiry: tokens.Expiry}
	if rawIDToken, ok := tokens.Extra("id_token").(string); ok {
		oidcToken.IDToken = rawIDToken
	}

	return oidcToken, nil
}

func (o *OpenIDClient) RefreshAccessToken(ctx context.Context, refreshToken string) (authtypes.OIDCToken, error) {
	clientCtx := oidc.ClientContext(ctx, o.httpClient)
	tok := &oauth2.Token{RefreshToken: refreshToken}
	tokenSource := o.oauth2Config("").
		TokenSource(clientCtx, tok)

	tokens, err := tokenSource.Token()
	if err != nil {
		return authtypes.OIDCToken{}, fmt.Errorf("token refresh failed: %w", err)
	}

	rt := tokens.RefreshToken
	if rt == "" {
		rt = refreshToken
	}

	oidcToken := authtypes.OIDCToken{
		AccessToken:  tokens.AccessToken,
		RefreshToken: rt,
		Expiry:       tokens.Expiry,
	}

	if rawIDToken, ok := tokens.Extra("id_token").(string); ok {
		oidcToken.IDToken = rawIDToken
	}

	if oidcToken.IDToken == "" {
		return authtypes.OIDCToken{}, fmt.Errorf("token refresh failed: id_token not found in the response")
	}
	return oidcToken, nil
}

func (o *OpenIDClient) GetRedirectURI(path string) (string, error) {
	u, err := url.Parse(o.redirectURI)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s://%s%s", u.Scheme, u.Host, path), nil
}

func (o OpenIDClient) OIDCConfig() *authtypes.OIDCConfiguration {
	return o.oidcConfig
}

func (o *OpenIDClient) oauth2Config(overwriteRedirectURI string, scopes ...string) *oauth2.Config {
	redirectURI := o.redirectURI
	if overwriteRedirectURI != "" {
		redirectURI = overwriteRedirectURI
	}

	return &oauth2.Config{
		ClientID:     o.oidcConfig.ClientID,
		ClientSecret: o.oidcConfig.ClientSecret,
		Endpoint:     o.provider.Endpoint(),
		Scopes:       scopes,
		RedirectURL:  redirectURI,
	}
}

// NewHeaderBearerTokenExtractor returns a token extractor which extracts the token from the given header.
func NewHeaderBearerTokenExtractor(header string) authtypes.TokenExtractor {
	return headerBearerTokenExtractor{name: header}
}

type headerBearerTokenExtractor struct {
	name string
}

// Extract extracts the bearer token from the header.
func (e headerBearerTokenExtractor) Extract(r *http.Request) (string, error) {
	header := r.Header.Get(e.name)
	if len(header) < 7 {
		return "", fmt.Errorf("haven't found a Bearer token in the %s header", e.name)
	}
	// strip BEARER/bearer/Bearer prefix
	return header[7:], nil
}

// NewQueryParamBearerTokenExtractor returns a token extractor which extracts the token from the given query parameter.
func NewQueryParamBearerTokenExtractor(header string) authtypes.TokenExtractor {
	return queryParamBearerTokenExtractor{name: header}
}

type queryParamBearerTokenExtractor struct {
	name string
}

// Extract extracts the bearer token from the query parameter.
func (e queryParamBearerTokenExtractor) Extract(r *http.Request) (string, error) {
	val := r.URL.Query().Get(e.name)
	if len(val) == 0 {
		return "", fmt.Errorf("haven't found an OIDC token in the query %q param ", e.name)
	}
	return val, nil
}

func NewCookieHeaderBearerTokenExtractor(header string) authtypes.TokenExtractor {
	return cookieHeaderBearerTokenExtractor{name: header}
}

type cookieHeaderBearerTokenExtractor struct {
	name string
}

func (e cookieHeaderBearerTokenExtractor) Extract(r *http.Request) (string, error) {
	cookie, err := r.Cookie("token")
	if err != nil {
		return "", fmt.Errorf("haven't found a Bearer token in the Cookie header %s: %w", e.name, err)
	}

	return cookie.Value, nil
}

func NewCookieHeaderBearerMultiTokenExtractor(header string) authtypes.TokenExtractor {
	return cookieHeaderBearerMultiTokenExtractor{name: header}
}

type cookieHeaderBearerMultiTokenExtractor struct {
	name string
}

func (e cookieHeaderBearerMultiTokenExtractor) Extract(r *http.Request) (string, error) {
	var finalToken strings.Builder

	for i := 1; ; i++ {
		tokenName := fmt.Sprintf("%s-%d", e.name, i)
		cookie, err := r.Cookie(tokenName)

		if err != nil {
			break
		}

		finalToken.WriteString(cookie.Value)
	}

	if finalToken.Len() == 0 {
		return "", fmt.Errorf("haven't found a Bearer token in the Cookie header %s", e.name)
	}

	return finalToken.String(), nil
}

// NewCombinedExtractor returns an token extractor which tries a list of token extractors until it finds a token.
func NewCombinedExtractor(extractors ...authtypes.TokenExtractor) authtypes.TokenExtractor {
	return combinedExtractor{extractors: extractors}
}

type combinedExtractor struct {
	extractors []authtypes.TokenExtractor
}

// Extract extracts the token via the given token extractors. Returns as soon as it finds a token.
func (c combinedExtractor) Extract(r *http.Request) (string, error) {
	for _, extractor := range c.extractors {
		token, err := extractor.Extract(r)
		if err == nil {
			return token, nil
		}
	}
	return "", fmt.Errorf("haven't found an OIDC token, tried %d extractors", len(c.extractors))
}
