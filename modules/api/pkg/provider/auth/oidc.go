package auth

import (
	"k8c.io/dashboard/v2/pkg/handler/auth"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8s.io/apimachinery/pkg/api/meta"
)

func OIDCIssuerVerifierProviderFactory(mapper meta.RESTMapper, seedKubeconfigGetter provider.SeedKubeconfigGetter) provider.OIDCIssuerVerifierGetter {
	return func(seed *kubermaticv1.Seed) (provider.OIDCIssuerVerifierProvider, error) {

		// TODO map stuff
		oidc := seed.Spec.OIDCProviderConfiguration
		return auth.NewOpenIDClient(
			oidc.IssuerUrl,
			oidc.IssuerClientID,
			oidc.IssuerClientIDSecret,
			options.oidcIssuerRedirectURI,
			auth.NewCombinedExtractor(
				auth.NewHeaderBearerTokenExtractor("Authorization"),
				auth.NewQueryParamBearerTokenExtractor("token"),
			),
			options.oidcSkipTLSVerify,
			options.caBundle.CertPool(),
		)
	}
}


