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

package auth

import (
	"github.com/gorilla/securecookie"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources/certificates"
)

func OIDCIssuerVerifierProviderFactory(
	defaultOIDCIssuerVerifier authtypes.OIDCIssuerVerifier,
	oidcIssuerRedirectURI string,
	caBundle *certificates.CABundle,
) provider.OIDCIssuerVerifierGetter {
	return func(seed *kubermaticv1.Seed) (authtypes.OIDCIssuerVerifier, error) {
		if seed.Spec.OIDCProviderConfiguration == nil {
			return defaultOIDCIssuerVerifier, nil
		}

		secureCookie := defaultOIDCIssuerVerifier.OIDCConfig().SecureCookie
		cookieSecureMode := defaultOIDCIssuerVerifier.OIDCConfig().CookieSecureMode
		offlineAccessAsScope := defaultOIDCIssuerVerifier.OIDCConfig().OfflineAccessAsScope
		skipTLSVerify := defaultOIDCIssuerVerifier.OIDCConfig().SkipTLSVerify

		// Overwriting default values from Seed configuration.
		seedOIDCProvConf := seed.Spec.OIDCProviderConfiguration
		if seedOIDCProvConf.CookieHashKey != nil {
			secureCookie = securecookie.New([]byte(*seedOIDCProvConf.CookieHashKey), nil)
		}
		if seedOIDCProvConf.CookieSecureMode != nil {
			cookieSecureMode = *seedOIDCProvConf.CookieSecureMode
		}
		if seedOIDCProvConf.OfflineAccessAsScope != nil {
			offlineAccessAsScope = *seedOIDCProvConf.OfflineAccessAsScope
		}
		if seedOIDCProvConf.SkipTLSVerify != nil {
			skipTLSVerify = *seedOIDCProvConf.SkipTLSVerify
		}

		return auth.NewOpenIDClient(
			&authtypes.OIDCConfiguration{
				URL:                  seedOIDCProvConf.IssuerURL,
				ClientID:             seedOIDCProvConf.IssuerClientID,
				ClientSecret:         seedOIDCProvConf.IssuerClientSecret,
				SecureCookie:         secureCookie,
				CookieSecureMode:     cookieSecureMode,
				OfflineAccessAsScope: offlineAccessAsScope,
				SkipTLSVerify:        skipTLSVerify,
			},
			oidcIssuerRedirectURI,
			auth.NewCombinedExtractor(
				auth.NewHeaderBearerTokenExtractor("Authorization"),
				auth.NewQueryParamBearerTokenExtractor("token"),
			),
			caBundle.CertPool(),
		)
	}
}
