package auth

import (
	"github.com/gorilla/securecookie"

	"k8c.io/dashboard/v2/pkg/handler/auth"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
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

		// Overwriting default vaules from Seed configuration.
		oidc := seed.Spec.OIDCProviderConfiguration
		if oidc.CookieHashKey != nil {
			secureCookie = securecookie.New([]byte(*oidc.CookieHashKey), nil)
		}
		if oidc.CookieSecureMode != nil {
			cookieSecureMode = *oidc.CookieSecureMode
		}
		if oidc.OfflineAccessAsScope != nil {
			offlineAccessAsScope = *oidc.OfflineAccessAsScope
		}
		if oidc.SkipTLSVerify != nil {
			skipTLSVerify = *oidc.SkipTLSVerify
		}

		return auth.NewOpenIDClient(
			&authtypes.OIDCConfiguration{
				URL:                  oidc.IssuerURL,
				ClientID:             oidc.IssuerClientID,
				ClientSecret:         oidc.IssuerClientSecret,
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
