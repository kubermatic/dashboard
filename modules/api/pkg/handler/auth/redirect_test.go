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

package auth_test

import (
	"errors"
	"net/url"
	"testing"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)

func TestAllowedOrigin(t *testing.T) {
	allowed := []string{
		"https://kkp.example.com/api/v1/kubeconfig",
		"https://kkp-proxy.example.com",
		"https://kkp-internal.example.com:8443",
		"http://kkp-http.example.com",
		"https://[2001:db8::1]",
		"https://KKP-Port.example.com:443/api/v2/auth/callback",
		"not a url %%",
		"ftp://kkp-ftp.example.com",
	}

	testCases := []struct {
		name          string
		origin        string
		allowed       []string
		expected      string
		expectErr     bool
		expectNoMatch bool
	}{
		{
			name:     "matches host of the default redirect URL, path is ignored",
			origin:   "https://kkp.example.com",
			allowed:  allowed,
			expected: "https://kkp.example.com",
		},
		{
			name:     "matches an additional redirect URL",
			origin:   "https://kkp-proxy.example.com",
			allowed:  allowed,
			expected: "https://kkp-proxy.example.com",
		},
		{
			name:     "host and scheme are compared case-insensitively",
			origin:   "HTTPS://KKP-Proxy.Example.com",
			allowed:  allowed,
			expected: "https://kkp-proxy.example.com",
		},
		{
			name:     "trailing slash is accepted",
			origin:   "https://kkp-proxy.example.com/",
			allowed:  allowed,
			expected: "https://kkp-proxy.example.com",
		},
		{
			name:     "default port is ignored",
			origin:   "https://kkp-proxy.example.com:443",
			allowed:  allowed,
			expected: "https://kkp-proxy.example.com",
		},
		{
			name:     "matched entry is returned as configured",
			origin:   "https://kkp-port.example.com",
			allowed:  allowed,
			expected: "https://KKP-Port.example.com:443",
		},
		{
			name:     "non-default port must match",
			origin:   "https://kkp-internal.example.com:8443",
			allowed:  allowed,
			expected: "https://kkp-internal.example.com:8443",
		},
		{
			name:     "http is allowed when configured",
			origin:   "http://kkp-http.example.com",
			allowed:  allowed,
			expected: "http://kkp-http.example.com",
		},
		{
			name:     "IPv6 host",
			origin:   "https://[2001:db8::1]",
			allowed:  allowed,
			expected: "https://[2001:db8::1]",
		},
		{
			name:          "unknown host",
			origin:        "https://evil.example.com",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "subdomain of an allowed host",
			origin:        "https://evil.kkp.example.com",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "different port",
			origin:        "https://kkp-internal.example.com:9443",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "missing non-default port",
			origin:        "https://kkp-internal.example.com",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "different scheme",
			origin:        "http://kkp.example.com",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "non-http allowed entries are ignored",
			origin:        "https://kkp-ftp.example.com",
			allowed:       allowed,
			expectNoMatch: true,
		},
		{
			name:          "empty allow list",
			origin:        "https://kkp.example.com",
			allowed:       nil,
			expectNoMatch: true,
		},
		{
			name:      "empty origin",
			origin:    "",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "host without scheme",
			origin:    "kkp.example.com",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "non-http scheme",
			origin:    "javascript:alert(1)",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "path",
			origin:    "https://kkp.example.com/evil",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "query",
			origin:    "https://kkp.example.com?x=1",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "fragment",
			origin:    "https://kkp.example.com#x",
			allowed:   allowed,
			expectErr: true,
		},
		{
			name:      "user info",
			origin:    "https://evil.example.com@kkp.example.com",
			allowed:   allowed,
			expectErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := auth.AllowedOrigin(tc.origin, tc.allowed...)

			switch {
			case tc.expectNoMatch:
				if !errors.Is(err, auth.ErrOriginNotAllowed) {
					t.Fatalf("expected ErrOriginNotAllowed, got %q, %v", got, err)
				}
			case tc.expectErr:
				if err == nil || errors.Is(err, auth.ErrOriginNotAllowed) {
					t.Fatalf("expected an invalid origin error, got %q, %v", got, err)
				}
			default:
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if got != tc.expected {
					t.Fatalf("expected %q, got %q", tc.expected, got)
				}
			}
		})
	}
}

// stubVerifier implements only the methods RedirectURIForOrigin calls.
type stubVerifier struct {
	authtypes.OIDCIssuerVerifier
	redirectURI            string
	additionalRedirectURIs []string
}

func (s stubVerifier) GetRedirectURI(path string) (string, error) {
	u, err := url.Parse(s.redirectURI)
	if err != nil {
		return "", err
	}
	return u.Scheme + "://" + u.Host + path, nil
}

func (s stubVerifier) OIDCConfig() *authtypes.OIDCConfiguration {
	return &authtypes.OIDCConfiguration{AdditionalRedirectURIs: s.additionalRedirectURIs}
}

func TestRedirectURIForOrigin(t *testing.T) {
	verifier := stubVerifier{
		redirectURI: "https://kkp.example.com:443/custom/path",
		additionalRedirectURIs: []string{
			"https://kkp-proxy.example.com",
			"https://kkp-internal.example.com:8443/",
			// an entry for the main hostname must not change the main hostname's redirect URI
			"https://kkp.example.com",
		},
	}

	testCases := []struct {
		name     string
		origin   string
		expected string
	}{
		{
			name:     "additional origin gets its entry plus the path",
			origin:   "https://kkp-proxy.example.com",
			expected: "https://kkp-proxy.example.com/api/v1/kubeconfig",
		},
		{
			name:     "additional origin with port",
			origin:   "https://kkp-internal.example.com:8443",
			expected: "https://kkp-internal.example.com:8443/api/v1/kubeconfig",
		},
		{
			name:     "origin is matched in canonical form",
			origin:   "HTTPS://KKP-Proxy.example.com:443",
			expected: "https://kkp-proxy.example.com/api/v1/kubeconfig",
		},
		{
			name:   "main hostname keeps the caller's default",
			origin: "https://kkp.example.com",
		},
		{
			name: "no origin keeps the caller's default",
		},
		{
			name:   "unlisted origin keeps the caller's default",
			origin: "https://evil.example.com",
		},
		{
			name:   "origin with a path keeps the caller's default",
			origin: "https://kkp-proxy.example.com/evil",
		},
		{
			name:   "invalid origin keeps the caller's default",
			origin: "not a url %%",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if got := auth.RedirectURIForOrigin(verifier, tc.origin, "/api/v1/kubeconfig"); got != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, got)
			}
		})
	}
}

func TestValidateAdditionalRedirectURI(t *testing.T) {
	testCases := []struct {
		uri         string
		expectedErr string
	}{
		{uri: "https://kkp-proxy.example.com"},
		{uri: "https://kkp-proxy.example.com/"},
		{uri: "http://kkp-proxy.example.com:8080"},
		{uri: "https://[2001:db8::1]:8443"},
		{uri: "https://[2001:db8::1]"},
		{uri: "ftp://kkp.example.com", expectedErr: "scheme must be http or https"},
		{uri: "kkp.example.com", expectedErr: "scheme must be http or https"},
		{uri: "https://", expectedErr: "host must not be empty"},
		{uri: "https://user@kkp.example.com", expectedErr: "must not contain user info"},
		{uri: "https://kkp.example.com?a=b", expectedErr: "must not contain a query or fragment"},
		{uri: "https://kkp.example.com#a", expectedErr: "must not contain a query or fragment"},
		{uri: "https://kkp.example.com/api/v2/auth/callback", expectedErr: "must not contain a path, only scheme, host and optional port"},
		{uri: "https://kkp.example.com:0", expectedErr: "port must be between 1 and 65535"},
		{uri: "https://kkp.example.com:65536", expectedErr: "port must be between 1 and 65535"},
		{uri: "https://kkp.example.com:0443", expectedErr: "port must not have leading zeros"},
		{uri: "http://kkp.example.com:08080", expectedErr: "port must not have leading zeros"},
		{uri: "https://kkp.example.com.", expectedErr: "host must not end with a dot"},
		{uri: "https://[fe80::1%25eth0]", expectedErr: "host must not contain an IPv6 zone"},
		{uri: "https://kkp.exämple.com", expectedErr: "host must be ASCII, use the punycode form"},
		{uri: "HTTPS://kkp.example.com", expectedErr: `must be written in canonical form as "https://kkp.example.com" (lower case, without the default port)`},
		{uri: "https://KKP.example.com", expectedErr: `must be written in canonical form as "https://kkp.example.com" (lower case, without the default port)`},
		{uri: "https://kkp.example.com:443", expectedErr: `must be written in canonical form as "https://kkp.example.com" (lower case, without the default port)`},
		{uri: "http://kkp.example.com:80/", expectedErr: `must be written in canonical form as "http://kkp.example.com" (lower case, without the default port)`},
		{uri: "https://kkp.example.com:", expectedErr: `must be written in canonical form as "https://kkp.example.com" (lower case, without the default port)`},
	}

	for _, tc := range testCases {
		t.Run(tc.uri, func(t *testing.T) {
			err := auth.ValidateAdditionalRedirectURI(tc.uri)
			if tc.expectedErr == "" {
				if err != nil {
					t.Fatalf("expected no error, got %v", err)
				}
				return
			}
			if err == nil || err.Error() != tc.expectedErr {
				t.Fatalf("expected error %q, got %v", tc.expectedErr, err)
			}
		})
	}
}
