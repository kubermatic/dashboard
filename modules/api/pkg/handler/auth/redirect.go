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
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
)

// ErrOriginNotAllowed is returned when an origin matches none of the allowed redirect URLs.
var ErrOriginNotAllowed = errors.New("origin does not match any allowed redirect URL")

// AllowedOrigin returns the scheme and host of the first allowedURLs entry whose scheme, host and
// port match origin. They are compared in canonical form, paths are ignored. The entry is returned
// as configured, e.g. with an explicit default port, since the OIDC provider compares redirect URIs
// exactly.
//
// origin is client-controlled (the browser's window.location.origin), so it must never be used as
// an OIDC redirect without passing this check: an IdP that accepts loose redirect URIs would
// otherwise deliver authorization codes to any host an attacker puts there.
func AllowedOrigin(origin string, allowedURLs ...string) (string, error) {
	want, err := parseOrigin(origin)
	if err != nil {
		return "", fmt.Errorf("invalid origin %q: %w", origin, err)
	}

	for _, allowed := range allowedURLs {
		u, err := url.Parse(allowed)
		if err != nil || !isHTTPScheme(u.Scheme) || u.Host == "" {
			continue
		}
		if canonicalOrigin(u) == want {
			return u.Scheme + "://" + u.Host, nil
		}
	}

	return "", ErrOriginNotAllowed
}

// parseOrigin parses a bare origin (scheme://host[:port]) and returns its canonical form.
func parseOrigin(origin string) (string, error) {
	u, err := url.Parse(origin)
	if err != nil {
		return "", err
	}
	if !isHTTPScheme(u.Scheme) {
		return "", errors.New("scheme must be http or https")
	}
	if u.Host == "" {
		return "", errors.New("host is missing")
	}
	if u.User != nil || (u.Path != "" && u.Path != "/") || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" {
		return "", errors.New("must only contain scheme, host and port")
	}
	return canonicalOrigin(u), nil
}

// canonicalOrigin returns scheme://host[:port] in lower case, without the scheme's default port.
func canonicalOrigin(u *url.URL) string {
	scheme := strings.ToLower(u.Scheme)
	host := strings.ToLower(u.Hostname())
	port := u.Port()
	if (scheme == "https" && port == "443") || (scheme == "http" && port == "80") {
		port = ""
	}

	if port != "" {
		host = net.JoinHostPort(host, port)
	} else if strings.Contains(host, ":") {
		host = "[" + host + "]"
	}

	return scheme + "://" + host
}

func isHTTPScheme(scheme string) bool {
	scheme = strings.ToLower(scheme)
	return scheme == "http" || scheme == "https"
}
