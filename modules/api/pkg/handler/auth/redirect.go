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
	"strconv"
	"strings"
	"unicode"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	"k8c.io/kubermatic/v2/pkg/log"
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

// RedirectURIForOrigin returns the OIDC redirect URI for a flow the browser started on origin: the
// additional redirect URI of verifier that matches origin, followed by path. It returns "" when
// origin is empty, invalid, not allowed or the origin of -oidc-issuer-redirect-uri. The caller then
// keeps its default redirect URI, so flows on the main hostname send exactly what they sent before.
func RedirectURIForOrigin(verifier authtypes.OIDCIssuerVerifier, origin, path string) string {
	if origin == "" {
		return ""
	}

	// the main hostname is checked on its own, so that a match keeps the caller's default
	if primary, err := verifier.GetRedirectURI(""); err == nil {
		if _, err := AllowedOrigin(origin, primary); err == nil {
			return ""
		}
	}

	matched, err := AllowedOrigin(origin, verifier.OIDCConfig().AdditionalRedirectURIs...)
	if err != nil {
		log.Logger.Infow("ignoring origin, using the default redirect URI", "origin", origin)
		return ""
	}

	return matched + path
}

// ValidateAdditionalRedirectURI checks that uri is an origin (scheme, host and optional port),
// optionally followed by "/", in the canonical spelling AllowedOrigin compares against. The OIDC
// provider compares redirect URIs byte for byte, so any other spelling would be rejected there.
func ValidateAdditionalRedirectURI(uri string) error {
	u, err := url.Parse(uri)
	if err != nil {
		return fmt.Errorf("failed to parse URL: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return errors.New("scheme must be http or https")
	}
	if u.Host == "" {
		return errors.New("host must not be empty")
	}
	if u.User != nil {
		return errors.New("must not contain user info")
	}
	if u.RawQuery != "" || u.ForceQuery || u.Fragment != "" {
		return errors.New("must not contain a query or fragment")
	}
	if u.Path != "" && u.Path != "/" {
		return errors.New("must not contain a path, only scheme, host and optional port")
	}
	if port := u.Port(); port != "" {
		n, err := strconv.Atoi(port)
		if err != nil || n < 1 || n > 65535 {
			return errors.New("port must be between 1 and 65535")
		}
		// browsers send the port without leading zeros, so "0443" could never match
		if port != strconv.Itoa(n) {
			return errors.New("port must not have leading zeros")
		}
	}
	host := u.Hostname()
	if strings.HasSuffix(host, ".") {
		return errors.New("host must not end with a dot")
	}
	if strings.Contains(host, "%") {
		return errors.New("host must not contain an IPv6 zone")
	}
	for _, r := range host {
		if r > unicode.MaxASCII {
			return errors.New("host must be ASCII, use the punycode form")
		}
	}

	// url.Parse lower-cases the scheme, so compare against the raw input
	if canonical := canonicalOrigin(u); strings.TrimSuffix(uri, "/") != canonical {
		return fmt.Errorf("must be written in canonical form as %q (lower case, without the default port)", canonical)
	}

	return nil
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
