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
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/securecookie"
	"golang.org/x/oauth2"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
)

const (
	testLoginURL    = "http://localhost/api/v2/auth/login"
	testCallbackURL = "http://localhost/api/v2/auth/callback"
	testRefreshURL  = "http://localhost/api/v2/auth/refresh"
	testLogoutURL   = "http://localhost/api/v2/auth/logout"
	testStatusURL   = "http://localhost/api/v2/auth/status"
)

// fakeVerifier implements authtypes.OIDCIssuerVerifier with per-test behavior
// set via its fields.
type fakeVerifier struct {
	secureCookie     *securecookie.SecureCookie
	cookieSecureMode bool
	offlineAsScope   bool
	redirectURI      string

	exchangeToken authtypes.OIDCToken
	exchangeErr   error

	refreshToken authtypes.OIDCToken
	refreshErr   error

	verifyClaims authtypes.TokenClaims
	verifyErr    error
}

// Compile-time check that fakeVerifier satisfies the interface the handler needs.
var _ authtypes.OIDCIssuerVerifier = &fakeVerifier{}

func (f *fakeVerifier) OIDCConfig() *authtypes.OIDCConfiguration {
	return &authtypes.OIDCConfiguration{
		URL:                  "https://dex.example.com",
		ClientID:             "kubermaticIssuer",
		SecureCookie:         f.secureCookie,
		CookieSecureMode:     f.cookieSecureMode,
		OfflineAccessAsScope: f.offlineAsScope,
	}
}

func (f *fakeVerifier) AuthCodeURL(state string, _ bool, redirectURI string, scopes ...string) string {
	v := url.Values{}
	v.Set("client_id", "kubermaticIssuer")
	v.Set("redirect_uri", redirectURI)
	v.Set("response_type", "code")
	v.Set("state", state)
	v.Set("scope", strings.Join(scopes, " "))
	return "https://dex.example.com/auth?" + v.Encode()
}

func (f *fakeVerifier) Exchange(_ context.Context, _, _ string, _ ...string) (authtypes.OIDCToken, error) {
	return f.exchangeToken, f.exchangeErr
}

func (f *fakeVerifier) RefreshAccessToken(_ context.Context, _ string) (authtypes.OIDCToken, error) {
	return f.refreshToken, f.refreshErr
}

func (f *fakeVerifier) Verify(_ context.Context, _ string) (authtypes.TokenClaims, error) {
	return f.verifyClaims, f.verifyErr
}

func (f *fakeVerifier) GetRedirectURI(path string) (string, error) {
	return f.redirectURI + path, nil
}

// Extract is part of the interface but the handlers use their own cookie-based
// tokenExtractor (built in NewAuthHandler), so this is never called.
func (f *fakeVerifier) Extract(_ *http.Request) (string, error) {
	return "", nil
}

// fakeUserProvider implements provider.UserProvider but only the two methods the
// auth handlers call (UserByEmail, InvalidateToken).
type fakeUserProvider struct {
	usersByEmail      map[string]*kubermaticv1.User
	userByEmailErr    error
	invalidateErr     error
	invalidatedTokens []string
}

var _ provider.UserProvider = &fakeUserProvider{}

func (f *fakeUserProvider) UserByEmail(_ context.Context, email string) (*kubermaticv1.User, error) {
	if f.userByEmailErr != nil {
		return nil, f.userByEmailErr
	}
	if u, ok := f.usersByEmail[email]; ok {
		return u, nil
	}
	return &kubermaticv1.User{}, nil
}

func (f *fakeUserProvider) InvalidateToken(_ context.Context, _ *kubermaticv1.User, token string, _ apiv1.Time) error {
	if f.invalidateErr != nil {
		return f.invalidateErr
	}
	f.invalidatedTokens = append(f.invalidatedTokens, token)
	return nil
}

// Unused interface methods — no-op stubs so the type satisfies the interface.
func (f *fakeUserProvider) CreateUser(context.Context, string, string, []string) (*kubermaticv1.User, error) {
	return nil, nil
}
func (f *fakeUserProvider) UpdateUser(context.Context, *kubermaticv1.User) (*kubermaticv1.User, error) {
	return nil, nil
}
func (f *fakeUserProvider) UserByID(context.Context, string) (*kubermaticv1.User, error) {
	return nil, nil
}
func (f *fakeUserProvider) GetInvalidatedTokens(context.Context, *kubermaticv1.User) ([]string, error) {
	return nil, nil
}
func (f *fakeUserProvider) List(context.Context) ([]kubermaticv1.User, error) { return nil, nil }

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// newTestSecureCookie returns a SecureCookie with a fixed 32-byte hash key and
// no block key — i.e. signing-only, matching how production initializes it.
func newTestSecureCookie() *securecookie.SecureCookie {
	return securecookie.New([]byte("0123456789abcdef0123456789abcdef"), nil)
}

// newTestHandler builds an authHandler wired to the given fakes. Passing nil for
// userProvider or configGetter fills in harmless defaults.
func newTestHandler(verifier *fakeVerifier, userProvider provider.UserProvider, configGetter provider.KubermaticConfigurationGetter) *authHandler {
	if userProvider == nil {
		userProvider = &fakeUserProvider{}
	}
	if configGetter == nil {
		configGetter = func(context.Context) (*kubermaticv1.KubermaticConfiguration, error) {
			return &kubermaticv1.KubermaticConfiguration{}, nil
		}
	}
	return NewAuthHandler(verifier, userProvider, configGetter)
}

// findCookie returns the named cookie from a response, or nil if absent.
func findCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, c := range cookies {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// findSetCookie returns the named cookie that is being *set* (non-empty value).
// A handler may both clear and re-set a cookie in one response (e.g. refresh
// clears all auth cookies, then writes the new token), so the response can hold
// two cookies of the same name — this picks the one carrying a value.
func findSetCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, c := range cookies {
		if c.Name == name && c.Value != "" {
			return c
		}
	}
	return nil
}

// assertCookieCleared fails the test if the named cookie is not present in the
// response as a deletion.
func assertCookieCleared(t *testing.T, cookies []*http.Cookie, name string) {
	t.Helper()
	c := findCookie(cookies, name)
	if c == nil {
		t.Errorf("expected %q cookie to be cleared, but it was not set at all", name)
		return
	}
	if c.MaxAge >= 0 || c.Value != "" {
		t.Errorf("expected %q cookie cleared (empty value, negative MaxAge), got value=%q MaxAge=%d", name, c.Value, c.MaxAge)
	}
}

// -----------------------------------------------------------------------------
// loginHandler
// -----------------------------------------------------------------------------

func TestLoginHandler(t *testing.T) {
	sc := newTestSecureCookie()
	verifier := &fakeVerifier{secureCookie: sc}
	h := newTestHandler(verifier, nil, nil)

	req := httptest.NewRequest(http.MethodGet, testLoginURL, nil)
	rec := httptest.NewRecorder()
	h.loginHandler().ServeHTTP(rec, req)

	// 1. The handler must redirect the browser to the OIDC provider.
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("expected status %d, got %d (body: %q)", http.StatusSeeOther, rec.Code, rec.Body.String())
	}

	// 2. It must set the short-lived _oauth_state cookie with the right attributes.
	var stateCookie *http.Cookie
	for _, c := range rec.Result().Cookies() {
		if c.Name == oauthStateCookieName {
			stateCookie = c
		}
	}
	if stateCookie == nil {
		t.Fatalf("expected %q cookie to be set", oauthStateCookieName)
	}
	if !stateCookie.HttpOnly {
		t.Error("expected state cookie to be HttpOnly")
	}
	if stateCookie.MaxAge != oauthStateCookieMaxAge {
		t.Errorf("expected state cookie MaxAge %d, got %d", oauthStateCookieMaxAge, stateCookie.MaxAge)
	}

	// 3. The cookie payload must contain a state, nonce, and PKCE verifier.
	var stored oauthStateCookie
	if err := sc.Decode(oauthStateCookieName, stateCookie.Value, &stored); err != nil {
		t.Fatalf("failed to decode state cookie: %v", err)
	}
	if stored.State == "" || stored.Nonce == "" || stored.CodeVerifier == "" {
		t.Errorf("expected non-empty state/nonce/codeVerifier, got %+v", stored)
	}

	// 4. The redirect URL must carry matching state/nonce and correct PKCE params.
	loc := rec.Header().Get("Location")
	u, err := url.Parse(loc)
	if err != nil {
		t.Fatalf("failed to parse redirect Location %q: %v", loc, err)
	}
	q := u.Query()
	if got := q.Get("state"); got != stored.State {
		t.Errorf("state in URL %q != state in cookie %q", got, stored.State)
	}
	if got := q.Get("nonce"); got != stored.Nonce {
		t.Errorf("nonce in URL %q != nonce in cookie %q", got, stored.Nonce)
	}
	if got := q.Get("code_challenge_method"); got != "S256" {
		t.Errorf("expected code_challenge_method=S256, got %q", got)
	}
	// The code_challenge must be the S256 hash of the stored verifier — this
	// proves PKCE is wired correctly end to end.
	if got, want := q.Get("code_challenge"), oauth2.S256ChallengeFromVerifier(stored.CodeVerifier); got != want {
		t.Errorf("code_challenge %q does not match S256(verifier) %q", got, want)
	}
}

// -----------------------------------------------------------------------------
// statusHandler
// -----------------------------------------------------------------------------

func TestStatusHandler(t *testing.T) {
	futureExpiry := apiv1.NewTime(time.Now().Add(time.Hour))

	tests := []struct {
		name         string
		token        string // value of the "token" cookie; "" means no cookie set
		verifyClaims authtypes.TokenClaims
		verifyErr    error
		wantStatus   int
		wantExpires  int64 // only checked when wantStatus is 200
	}{
		{
			name:         "valid token returns expiry",
			token:        "fakeTokenId",
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: futureExpiry},
			wantStatus:   http.StatusOK,
			wantExpires:  futureExpiry.Unix(),
		},
		{
			name:        "no token returns expires_at 0",
			token:       "",
			wantStatus:  http.StatusOK,
			wantExpires: 0,
		},
		{
			name:       "invalid token returns 401",
			token:      "fakeInvalidToken",
			verifyErr:  errors.New("invalid token"),
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			verifier := &fakeVerifier{
				secureCookie: newTestSecureCookie(),
				verifyClaims: tc.verifyClaims,
				verifyErr:    tc.verifyErr,
			}
			h := newTestHandler(verifier, nil, nil)

			req := httptest.NewRequest(http.MethodGet, testStatusURL, nil)
			if tc.token != "" {
				req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: tc.token})
			}
			rec := httptest.NewRecorder()
			h.statusHandler().ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("expected status %d, got %d (body: %q)", tc.wantStatus, rec.Code, rec.Body.String())
			}
			if tc.wantStatus == http.StatusOK {
				var resp authStatusResponse
				if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
					t.Fatalf("failed to decode response body: %v", err)
				}
				if resp.ExpiresAt != tc.wantExpires {
					t.Errorf("expected expires_at %d, got %d", tc.wantExpires, resp.ExpiresAt)
				}
			}
		})
	}
}

// -----------------------------------------------------------------------------
// logoutHandler
// -----------------------------------------------------------------------------

func TestLogoutHandler(t *testing.T) {
	futureExpiry := apiv1.NewTime(time.Now().Add(time.Hour))

	t.Run("happy path invalidates token and clears cookies", func(t *testing.T) {
		userProvider := &fakeUserProvider{
			usersByEmail: map[string]*kubermaticv1.User{"john@acme.com": {}},
		}
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: futureExpiry},
		}
		h := newTestHandler(verifier, userProvider, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: "fakeTokenId"})
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d (body: %q)", http.StatusOK, rec.Code, rec.Body.String())
		}

		// The response should carry a redirect path.
		var resp map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["redirect"] == "" {
			t.Error("expected a non-empty redirect in the response")
		}

		// The token must have been invalidated server-side.
		if len(userProvider.invalidatedTokens) != 1 || userProvider.invalidatedTokens[0] != "fakeTokenId" {
			t.Errorf("expected token to be invalidated, got %v", userProvider.invalidatedTokens)
		}

		// Auth cookies must be cleared.
		cookies := rec.Result().Cookies()
		assertCookieCleared(t, cookies, idTokenCookieName)
		assertCookieCleared(t, cookies, refreshTokenCookieName)
	})

	t.Run("missing token still clears cookies and returns 401", func(t *testing.T) {
		verifier := &fakeVerifier{secureCookie: newTestSecureCookie()}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
		}
		// Logout is idempotent: cookies are cleared even when there is no token.
		assertCookieCleared(t, rec.Result().Cookies(), idTokenCookieName)
	})

	t.Run("invalid token still clears cookies and returns 401", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			verifyErr:    errors.New("bad token"),
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: "fakeInvalidToken"})
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
		}
		assertCookieCleared(t, rec.Result().Cookies(), idTokenCookieName)
	})

	t.Run("token invalidation failure returns 500 but still clears cookies", func(t *testing.T) {
		userProvider := &fakeUserProvider{
			usersByEmail:  map[string]*kubermaticv1.User{"john@acme.com": {}},
			invalidateErr: errors.New("db down"),
		}
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: futureExpiry},
		}
		h := newTestHandler(verifier, userProvider, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: "fakeTokenId"})
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
		}
		assertCookieCleared(t, rec.Result().Cookies(), idTokenCookieName)
	})

	t.Run("missing email claim returns 500", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			verifyClaims: authtypes.TokenClaims{Expiry: futureExpiry}, // verified, but no email
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: "fakeTokenId"})
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
		}
	})

	t.Run("user lookup failure returns 500", func(t *testing.T) {
		userProvider := &fakeUserProvider{userByEmailErr: errors.New("lookup failed")}
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: futureExpiry},
		}
		h := newTestHandler(verifier, userProvider, nil)

		req := httptest.NewRequest(http.MethodPost, testLogoutURL, nil)
		req.AddCookie(&http.Cookie{Name: idTokenCookieName, Value: "fakeTokenId"})
		rec := httptest.NewRecorder()
		h.logoutHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
		}
	})
}

// -----------------------------------------------------------------------------
// refreshHandler
// -----------------------------------------------------------------------------

func TestRefreshHandler(t *testing.T) {
	futureExpiry := apiv1.NewTime(time.Now().Add(time.Hour))
	pastExpiry := apiv1.NewTime(time.Now().Add(-time.Hour))

	t.Run("happy path issues new token and refresh cookies", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			refreshToken: authtypes.OIDCToken{IDToken: "fakeRefreshedTokenId", RefreshToken: "fakeRotatedRefreshToken"},
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: futureExpiry},
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testRefreshURL, nil)
		req.AddCookie(&http.Cookie{Name: refreshTokenCookieName, Value: "fakeRefreshToken"})
		rec := httptest.NewRecorder()
		h.refreshHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d (body: %q)", http.StatusOK, rec.Code, rec.Body.String())
		}

		var resp authStatusResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp.ExpiresAt != futureExpiry.Unix() {
			t.Errorf("expected expires_at %d, got %d", futureExpiry.Unix(), resp.ExpiresAt)
		}

		cookies := rec.Result().Cookies()
		if c := findSetCookie(cookies, idTokenCookieName); c == nil || c.Value != "fakeRefreshedTokenId" {
			t.Errorf("expected new id_token cookie %q, got %+v", "fakeRefreshedTokenId", c)
		}
		if c := findSetCookie(cookies, refreshTokenCookieName); c == nil || c.Value != "fakeRotatedRefreshToken" {
			t.Errorf("expected rotated refresh_token cookie %q, got %+v", "fakeRotatedRefreshToken", c)
		}
	})

	t.Run("missing refresh_token cookie returns 401 and clears cookies", func(t *testing.T) {
		verifier := &fakeVerifier{secureCookie: newTestSecureCookie()}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testRefreshURL, nil)
		rec := httptest.NewRecorder()
		h.refreshHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
		}
		assertCookieCleared(t, rec.Result().Cookies(), idTokenCookieName)
	})

	t.Run("refresh failure returns 401 and clears cookies", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			refreshErr:   errors.New("refresh failed"),
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testRefreshURL, nil)
		req.AddCookie(&http.Cookie{Name: refreshTokenCookieName, Value: "fakeRefreshToken"})
		rec := httptest.NewRecorder()
		h.refreshHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
		}
		assertCookieCleared(t, rec.Result().Cookies(), idTokenCookieName)
	})

	t.Run("verify failure returns 401", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			refreshToken: authtypes.OIDCToken{IDToken: "fakeRefreshedTokenId"},
			verifyErr:    errors.New("verify failed"),
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testRefreshURL, nil)
		req.AddCookie(&http.Cookie{Name: refreshTokenCookieName, Value: "fakeRefreshToken"})
		rec := httptest.NewRecorder()
		h.refreshHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
		}
	})

	t.Run("already-expired refreshed token returns 401", func(t *testing.T) {
		verifier := &fakeVerifier{
			secureCookie: newTestSecureCookie(),
			refreshToken: authtypes.OIDCToken{IDToken: "fakeRefreshedTokenId"},
			verifyClaims: authtypes.TokenClaims{Email: "john@acme.com", Expiry: pastExpiry},
		}
		h := newTestHandler(verifier, nil, nil)

		req := httptest.NewRequest(http.MethodPost, testRefreshURL, nil)
		req.AddCookie(&http.Cookie{Name: refreshTokenCookieName, Value: "fakeRefreshToken"})
		rec := httptest.NewRecorder()
		h.refreshHandler().ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status %d, got %d (body: %q)", http.StatusUnauthorized, rec.Code, rec.Body.String())
		}
	})
}

// -----------------------------------------------------------------------------
// callbackHandler
// -----------------------------------------------------------------------------

// encodeStateCookie produces a signed _oauth_state cookie using the same
// SecureCookie the handler will use to decode it.
func encodeStateCookie(t *testing.T, sc *securecookie.SecureCookie, state oauthStateCookie) *http.Cookie {
	t.Helper()
	encoded, err := sc.Encode(oauthStateCookieName, state)
	if err != nil {
		t.Fatalf("failed to encode state cookie: %v", err)
	}
	return &http.Cookie{Name: oauthStateCookieName, Value: encoded}
}

// runCallback issues a GET to the callback handler with the given state cookie
// (may be nil) and raw query string, returning the recorded response.
func runCallback(h *authHandler, stateCookie *http.Cookie, query string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, testCallbackURL+"?"+query, nil)
	if stateCookie != nil {
		req.AddCookie(stateCookie)
	}
	rec := httptest.NewRecorder()
	h.callbackHandler().ServeHTTP(rec, req)
	return rec
}

func TestCallbackHandler(t *testing.T) {
	futureExpiry := apiv1.NewTime(time.Now().Add(time.Hour))
	pastExpiry := apiv1.NewTime(time.Now().Add(-time.Hour))

	t.Run("happy path sets token cookies and redirects", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId", RefreshToken: "fakeRefreshToken"},
			verifyClaims:  authtypes.TokenClaims{Email: "john@acme.com", Nonce: "nonce-abc", Expiry: futureExpiry},
		}
		userProvider := &fakeUserProvider{
			usersByEmail: map[string]*kubermaticv1.User{
				"john@acme.com": {Spec: kubermaticv1.UserSpec{Settings: &kubermaticv1.UserSettings{}}},
			},
		}
		h := newTestHandler(verifier, userProvider, nil)

		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc", CodeVerifier: "verifier-xyz"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")

		if rec.Code != http.StatusSeeOther {
			t.Fatalf("expected status %d, got %d (body: %q)", http.StatusSeeOther, rec.Code, rec.Body.String())
		}
		cookies := rec.Result().Cookies()
		if c := findSetCookie(cookies, idTokenCookieName); c == nil || c.Value != "fakeTokenId" {
			t.Errorf("expected token cookie %q, got %+v", "fakeTokenId", c)
		}
		if c := findSetCookie(cookies, refreshTokenCookieName); c == nil || c.Value != "fakeRefreshToken" {
			t.Errorf("expected refresh_token cookie %q, got %+v", "fakeRefreshToken", c)
		}
		// The one-time state cookie must be cleared.
		assertCookieCleared(t, cookies, oauthStateCookieName)
	})

	t.Run("missing state or code returns 400", func(t *testing.T) {
		h := newTestHandler(&fakeVerifier{secureCookie: newTestSecureCookie()}, nil, nil)

		if rec := runCallback(h, nil, "code=fakeCode"); rec.Code != http.StatusBadRequest {
			t.Errorf("missing state: expected 400, got %d", rec.Code)
		}
		if rec := runCallback(h, nil, "state=state-123"); rec.Code != http.StatusBadRequest {
			t.Errorf("missing code: expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing state cookie returns 400", func(t *testing.T) {
		h := newTestHandler(&fakeVerifier{secureCookie: newTestSecureCookie()}, nil, nil)
		rec := runCallback(h, nil, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("undecodable state cookie returns 400", func(t *testing.T) {
		h := newTestHandler(&fakeVerifier{secureCookie: newTestSecureCookie()}, nil, nil)
		badCookie := &http.Cookie{Name: oauthStateCookieName, Value: "not-a-valid-encoded-value"}
		rec := runCallback(h, badCookie, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("state mismatch returns 400", func(t *testing.T) {
		sc := newTestSecureCookie()
		h := newTestHandler(&fakeVerifier{secureCookie: sc}, nil, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "stored-state", Nonce: "n"})
		rec := runCallback(h, cookie, "state=different-state&code=fakeCode")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("nonce mismatch returns 400", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId"},
			verifyClaims:  authtypes.TokenClaims{Email: "john@acme.com", Nonce: "wrong-nonce", Expiry: futureExpiry},
		}
		h := newTestHandler(verifier, nil, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d (body: %q)", rec.Code, rec.Body.String())
		}
	})

	t.Run("exchange failure returns 500", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{secureCookie: sc, exchangeErr: errors.New("exchange failed")}
		h := newTestHandler(verifier, nil, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})

	t.Run("missing email claim returns 400", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId"},
			verifyClaims:  authtypes.TokenClaims{Nonce: "nonce-abc", Expiry: futureExpiry}, // no email
		}
		h := newTestHandler(verifier, nil, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("already-expired id_token returns 500", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId"},
			verifyClaims:  authtypes.TokenClaims{Email: "john@acme.com", Nonce: "nonce-abc", Expiry: pastExpiry},
		}
		h := newTestHandler(verifier, nil, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})

	t.Run("large id_token is split into chunked cookies", func(t *testing.T) {
		sc := newTestSecureCookie()
		largeToken := strings.Repeat("x", maxCookieSize+1000) // exceeds a single cookie
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: largeToken},
			verifyClaims:  authtypes.TokenClaims{Email: "john@acme.com", Nonce: "nonce-abc", Expiry: futureExpiry},
		}
		userProvider := &fakeUserProvider{
			usersByEmail: map[string]*kubermaticv1.User{
				"john@acme.com": {Spec: kubermaticv1.UserSpec{Settings: &kubermaticv1.UserSettings{}}},
			},
		}
		h := newTestHandler(verifier, userProvider, nil)
		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")

		if rec.Code != http.StatusSeeOther {
			t.Fatalf("expected 303, got %d (body: %q)", rec.Code, rec.Body.String())
		}
		cookies := rec.Result().Cookies()

		// Reassemble token-1, token-2, ... and verify it equals the original token.
		var reassembled string
		for i := 1; ; i++ {
			c := findSetCookie(cookies, fmt.Sprintf("%s-%d", idTokenCookieName, i))
			if c == nil {
				break
			}
			reassembled += c.Value
		}
		if reassembled != largeToken {
			t.Errorf("reassembled chunked token mismatch: got len %d, want len %d", len(reassembled), len(largeToken))
		}
	})

	t.Run("user with nil settings redirects to root without panicking", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId"},
			verifyClaims:  authtypes.TokenClaims{Email: "bob@example.com", Nonce: "nonce-abc", Expiry: futureExpiry},
		}
		// A returning user whose Settings were never saved: CreateUser does not
		// initialize Spec.Settings, so it stays nil. The handler must not panic.
		userProvider := &fakeUserProvider{
			usersByEmail: map[string]*kubermaticv1.User{"bob@example.com": {}},
		}
		h := newTestHandler(verifier, userProvider, nil)

		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")

		if rec.Code != http.StatusSeeOther {
			t.Fatalf("expected 303, got %d (body: %q)", rec.Code, rec.Body.String())
		}
		if loc := rec.Header().Get("Location"); loc != "/" {
			t.Errorf("expected redirect to %q, got %q", "/", loc)
		}
	})

	t.Run("user lookup failure redirects to root", func(t *testing.T) {
		sc := newTestSecureCookie()
		verifier := &fakeVerifier{
			secureCookie:  sc,
			exchangeToken: authtypes.OIDCToken{IDToken: "fakeTokenId"},
			verifyClaims:  authtypes.TokenClaims{Email: "john@acme.com", Nonce: "nonce-abc", Expiry: futureExpiry},
		}
		// UserByEmail fails (e.g. user not created yet) — the callback should log
		// and gracefully redirect to "/" rather than error out.
		userProvider := &fakeUserProvider{userByEmailErr: errors.New("lookup failed")}
		h := newTestHandler(verifier, userProvider, nil)

		cookie := encodeStateCookie(t, sc, oauthStateCookie{State: "state-123", Nonce: "nonce-abc"})
		rec := runCallback(h, cookie, "state=state-123&code=fakeCode")

		if rec.Code != http.StatusSeeOther {
			t.Fatalf("expected 303, got %d (body: %q)", rec.Code, rec.Body.String())
		}
		if loc := rec.Header().Get("Location"); loc != "/" {
			t.Errorf("expected redirect to %q, got %q", "/", loc)
		}
	})
}
