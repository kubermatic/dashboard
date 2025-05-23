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

package v2

import (
	"context"
	"crypto/x509"
	"net/http"
	"os"

	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/go-kit/log"
	prometheusapi "github.com/prometheus/client_golang/api"
	"go.uber.org/zap"

	"k8c.io/dashboard/v2/pkg/handler"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	"k8c.io/dashboard/v2/pkg/serviceaccount"
	"k8c.io/dashboard/v2/pkg/watcher"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
	"k8c.io/kubermatic/v2/pkg/version/kubermatic"
)

// Routing represents an object which binds endpoints to http handlers.
type Routing struct {
	log                                            *zap.SugaredLogger
	logger                                         log.Logger
	presetProvider                                 provider.PresetProvider
	seedsGetter                                    provider.SeedsGetter
	seedsClientGetter                              provider.SeedClientGetter
	kubermaticConfigGetter                         provider.KubermaticConfigurationGetter
	sshKeyProvider                                 provider.SSHKeyProvider
	privilegedSSHKeyProvider                       provider.PrivilegedSSHKeyProvider
	userProvider                                   provider.UserProvider
	serviceAccountProvider                         provider.ServiceAccountProvider
	privilegedServiceAccountProvider               provider.PrivilegedServiceAccountProvider
	serviceAccountTokenProvider                    provider.ServiceAccountTokenProvider
	privilegedServiceAccountTokenProvider          provider.PrivilegedServiceAccountTokenProvider
	projectProvider                                provider.ProjectProvider
	privilegedProjectProvider                      provider.PrivilegedProjectProvider
	featureGatesProvider                           provider.FeatureGatesProvider
	tokenVerifiers                                 authtypes.TokenVerifier
	tokenExtractors                                authtypes.TokenExtractor
	clusterProviderGetter                          provider.ClusterProviderGetter
	addonProviderGetter                            provider.AddonProviderGetter
	addonConfigProvider                            provider.AddonConfigProvider
	prometheusClient                               prometheusapi.Client
	projectMemberProvider                          provider.ProjectMemberProvider
	privilegedProjectMemberProvider                provider.PrivilegedProjectMemberProvider
	userProjectMapper                              provider.ProjectMemberMapper
	saTokenAuthenticator                           serviceaccount.TokenAuthenticator
	saTokenGenerator                               serviceaccount.TokenGenerator
	eventRecorderProvider                          provider.EventRecorderProvider
	exposeStrategy                                 kubermaticv1.ExposeStrategy
	userInfoGetter                                 provider.UserInfoGetter
	settingsProvider                               provider.SettingsProvider
	adminProvider                                  provider.AdminProvider
	admissionPluginProvider                        provider.AdmissionPluginsProvider
	settingsWatcher                                watcher.SettingsWatcher
	userWatcher                                    watcher.UserWatcher
	externalClusterProvider                        provider.ExternalClusterProvider
	privilegedExternalClusterProvider              provider.PrivilegedExternalClusterProvider
	defaultConstraintProvider                      provider.DefaultConstraintProvider
	constraintTemplateProvider                     provider.ConstraintTemplateProvider
	constraintProviderGetter                       provider.ConstraintProviderGetter
	alertmanagerProviderGetter                     provider.AlertmanagerProviderGetter
	clusterTemplateProvider                        provider.ClusterTemplateProvider
	clusterTemplateInstanceProviderGetter          provider.ClusterTemplateInstanceProviderGetter
	ruleGroupProviderGetter                        provider.RuleGroupProviderGetter
	privilegedAllowedRegistryProvider              provider.PrivilegedAllowedRegistryProvider
	etcdBackupConfigProviderGetter                 provider.EtcdBackupConfigProviderGetter
	etcdRestoreProviderGetter                      provider.EtcdRestoreProviderGetter
	etcdBackupConfigProjectProviderGetter          provider.EtcdBackupConfigProjectProviderGetter
	etcdRestoreProjectProviderGetter               provider.EtcdRestoreProjectProviderGetter
	backupStorageProvider                          provider.BackupStorageProvider
	backupCredentialsProviderGetter                provider.BackupCredentialsProviderGetter
	policyTemplateProvider                         provider.PolicyTemplateProvider
	policyBindingProvider                          provider.PolicyBindingProvider
	privilegedMLAAdminSettingProviderGetter        provider.PrivilegedMLAAdminSettingProviderGetter
	seedProvider                                   provider.SeedProvider
	resourceQuotaProvider                          provider.ResourceQuotaProvider
	groupProjectBindingProvider                    provider.GroupProjectBindingProvider
	privilegedIPAMPoolProviderGetter               provider.PrivilegedIPAMPoolProviderGetter
	applicationDefinitionProvider                  provider.ApplicationDefinitionProvider
	privilegedOperatingSystemProfileProviderGetter provider.PrivilegedOperatingSystemProfileProviderGetter
	oidcIssuerVerifierProviderGetter               provider.OIDCIssuerVerifierGetter
	versions                                       kubermatic.Versions
	caBundle                                       *x509.CertPool
	features                                       features.FeatureGate
}

// NewV2Routing creates a new Routing.
func NewV2Routing(routingParams handler.RoutingParams) Routing {
	return Routing{
		log:                                            routingParams.Log,
		logger:                                         log.NewLogfmtLogger(os.Stderr),
		presetProvider:                                 routingParams.PresetProvider,
		seedsGetter:                                    routingParams.SeedsGetter,
		seedsClientGetter:                              routingParams.SeedsClientGetter,
		kubermaticConfigGetter:                         routingParams.KubermaticConfigurationGetter,
		clusterProviderGetter:                          routingParams.ClusterProviderGetter,
		addonProviderGetter:                            routingParams.AddonProviderGetter,
		addonConfigProvider:                            routingParams.AddonConfigProvider,
		sshKeyProvider:                                 routingParams.SSHKeyProvider,
		privilegedSSHKeyProvider:                       routingParams.PrivilegedSSHKeyProvider,
		featureGatesProvider:                           routingParams.FeatureGatesProvider,
		userProvider:                                   routingParams.UserProvider,
		serviceAccountProvider:                         routingParams.ServiceAccountProvider,
		privilegedServiceAccountProvider:               routingParams.PrivilegedServiceAccountProvider,
		serviceAccountTokenProvider:                    routingParams.ServiceAccountTokenProvider,
		privilegedServiceAccountTokenProvider:          routingParams.PrivilegedServiceAccountTokenProvider,
		projectProvider:                                routingParams.ProjectProvider,
		privilegedProjectProvider:                      routingParams.PrivilegedProjectProvider,
		tokenVerifiers:                                 routingParams.TokenVerifiers,
		tokenExtractors:                                routingParams.TokenExtractors,
		prometheusClient:                               routingParams.PrometheusClient,
		projectMemberProvider:                          routingParams.ProjectMemberProvider,
		privilegedProjectMemberProvider:                routingParams.PrivilegedProjectMemberProvider,
		userProjectMapper:                              routingParams.UserProjectMapper,
		saTokenAuthenticator:                           routingParams.SATokenAuthenticator,
		saTokenGenerator:                               routingParams.SATokenGenerator,
		eventRecorderProvider:                          routingParams.EventRecorderProvider,
		exposeStrategy:                                 routingParams.ExposeStrategy,
		userInfoGetter:                                 routingParams.UserInfoGetter,
		settingsProvider:                               routingParams.SettingsProvider,
		adminProvider:                                  routingParams.AdminProvider,
		admissionPluginProvider:                        routingParams.AdmissionPluginProvider,
		settingsWatcher:                                routingParams.SettingsWatcher,
		userWatcher:                                    routingParams.UserWatcher,
		externalClusterProvider:                        routingParams.ExternalClusterProvider,
		privilegedExternalClusterProvider:              routingParams.PrivilegedExternalClusterProvider,
		defaultConstraintProvider:                      routingParams.DefaultConstraintProvider,
		constraintTemplateProvider:                     routingParams.ConstraintTemplateProvider,
		constraintProviderGetter:                       routingParams.ConstraintProviderGetter,
		alertmanagerProviderGetter:                     routingParams.AlertmanagerProviderGetter,
		clusterTemplateProvider:                        routingParams.ClusterTemplateProvider,
		clusterTemplateInstanceProviderGetter:          routingParams.ClusterTemplateInstanceProviderGetter,
		ruleGroupProviderGetter:                        routingParams.RuleGroupProviderGetter,
		privilegedAllowedRegistryProvider:              routingParams.PrivilegedAllowedRegistryProvider,
		etcdBackupConfigProviderGetter:                 routingParams.EtcdBackupConfigProviderGetter,
		etcdRestoreProviderGetter:                      routingParams.EtcdRestoreProviderGetter,
		etcdBackupConfigProjectProviderGetter:          routingParams.EtcdBackupConfigProjectProviderGetter,
		etcdRestoreProjectProviderGetter:               routingParams.EtcdRestoreProjectProviderGetter,
		backupStorageProvider:                          routingParams.BackupStorageProvider,
		policyTemplateProvider:                         routingParams.PolicyTemplateProvider,
		policyBindingProvider:                          routingParams.PolicyBindingProvider,
		backupCredentialsProviderGetter:                routingParams.BackupCredentialsProviderGetter,
		privilegedMLAAdminSettingProviderGetter:        routingParams.PrivilegedMLAAdminSettingProviderGetter,
		seedProvider:                                   routingParams.SeedProvider,
		resourceQuotaProvider:                          routingParams.ResourceQuotaProvider,
		groupProjectBindingProvider:                    routingParams.GroupProjectBindingProvider,
		privilegedIPAMPoolProviderGetter:               routingParams.PrivilegedIPAMPoolProviderGetter,
		applicationDefinitionProvider:                  routingParams.ApplicationDefinitionProvider,
		privilegedOperatingSystemProfileProviderGetter: routingParams.PrivilegedOperatingSystemProfileProviderGetter,
		oidcIssuerVerifierProviderGetter:               routingParams.OIDCIssuerVerifierProviderGetter,
		versions:                                       routingParams.Versions,
		caBundle:                                       routingParams.CABundle,
		features:                                       routingParams.Features,
	}
}

func (r Routing) defaultServerOptions() []httptransport.ServerOption {
	var req *http.Request

	// wrap the request variable so that we do not hand a stable
	// "req" variable to NewRequestErrorHandler()
	provider := func() *http.Request {
		return req
	}

	return []httptransport.ServerOption{
		httptransport.ServerBefore(func(c context.Context, r *http.Request) context.Context {
			req = r
			return c
		}),
		httptransport.ServerErrorHandler(handler.NewRequestErrorHandler(r.log, provider)),
		httptransport.ServerErrorEncoder(handler.ErrorEncoder),
		httptransport.ServerBefore(middleware.TokenExtractor(r.tokenExtractors)),
		httptransport.ServerBefore(middleware.SetSeedsGetter(r.seedsGetter)),
	}
}
