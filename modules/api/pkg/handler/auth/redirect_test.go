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
	"testing"

	"k8c.io/dashboard/v2/pkg/handler/auth"
)

func TestAllowedOrigin(t *testing.T) {
	allowed := []string{
		"https://kkp.example.com/api/v1/kubeconfig",
		"https://kkp-proxy.example.com",
		"https://kkp-internal.example.com:8443",
		"http://kkp-http.example.com",
		"https://[2001:db8::1]",
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
