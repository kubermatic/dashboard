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

package admin

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	jsonpatch "github.com/evanphx/json-patch"
	"github.com/go-kit/kit/endpoint"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

// KubermaticSettingsEndpoint returns global settings.
func KubermaticSettingsEndpoint(settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		globalSettings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return ConvertCRDSettingsToAPISettingsSpec(&globalSettings.Spec), nil
	}
}

// KubermaticCustomLinksEndpoint returns custom links.
func KubermaticCustomLinksEndpoint(settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		globalSettings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return apiv1.GlobalCustomLinks(globalSettings.Spec.CustomLinks), nil
	}
}

// UpdateKubermaticSettingsEndpoint updates global settings.
func UpdateKubermaticSettingsEndpoint(userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(patchKubermaticSettingsReq)
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		existingGlobalSettings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		existingGlobalSettingsSpecJSON, err := json.Marshal(ConvertCRDSettingsToAPISettingsSpec(&existingGlobalSettings.Spec))
		if err != nil {
			return nil, utilerrors.NewBadRequest("cannot decode existing settings: %v", err)
		}

		patchedGlobalSettingsSpecJSON, err := jsonpatch.MergePatch(existingGlobalSettingsSpecJSON, req.Patch)
		if err != nil {
			return nil, utilerrors.NewBadRequest("cannot patch global settings: %v", err)
		}

		var patchedGlobalSettingsSpec *apiv2.GlobalSettings
		err = json.Unmarshal(patchedGlobalSettingsSpecJSON, &patchedGlobalSettingsSpec)
		if err != nil {
			return nil, utilerrors.NewBadRequest("cannot decode patched settings: %v", err)
		}

		existingGlobalSettings.Spec, err = convertAPISettingsToSettingsSpec(patchedGlobalSettingsSpec)
		if err != nil {
			return nil, utilerrors.NewBadRequest("cannot convert API settings to CRD settings: %v", err)
		}
		globalSettings, err := settingsProvider.UpdateGlobalSettings(ctx, userInfo, existingGlobalSettings)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return ConvertCRDSettingsToAPISettingsSpec(&globalSettings.Spec), nil
	}
}

// patchKubermaticSettingsReq defines HTTP request for patchKubermaticSettings endpoint
// swagger:parameters patchKubermaticSettings
type patchKubermaticSettingsReq struct {
	// in: body
	Patch json.RawMessage
}

func DecodePatchKubermaticSettingsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req patchKubermaticSettingsReq
	var err error

	if req.Patch, err = io.ReadAll(r.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func convertAPISettingsToSettingsSpec(settings *apiv2.GlobalSettings) (kubermaticv1.SettingSpec, error) {
	s := kubermaticv1.SettingSpec{
		CustomLinks:                      settings.CustomLinks,
		DefaultNodeCount:                 settings.DefaultNodeCount,
		DisplayDemoInfo:                  settings.DisplayDemoInfo,
		DisplayAPIDocs:                   settings.DisplayAPIDocs,
		DisplayTermsOfService:            settings.DisplayTermsOfService,
		EnableDashboard:                  settings.EnableDashboard,
		EnableWebTerminal:                settings.EnableWebTerminal,
		EnableShareCluster:               ptr.To[bool](settings.EnableShareCluster),
		EnableOIDCKubeconfig:             settings.EnableOIDCKubeconfig,
		EnableClusterBackups:             settings.EnableClusterBackups,
		EnableEtcdBackup:                 settings.EnableEtcdBackup,
		DisableAdminKubeconfig:           settings.DisableAdminKubeconfig,
		UserProjectsLimit:                settings.UserProjectsLimit,
		RestrictProjectCreation:          settings.RestrictProjectCreation,
		RestrictProjectDeletion:          settings.RestrictProjectDeletion,
		EnableExternalClusterImport:      settings.EnableExternalClusterImport,
		CleanupOptions:                   settings.CleanupOptions,
		OpaOptions:                       settings.OpaOptions,
		MlaOptions:                       settings.MlaOptions,
		MlaAlertmanagerPrefix:            settings.MlaAlertmanagerPrefix,
		MlaGrafanaPrefix:                 settings.MlaGrafanaPrefix,
		Notifications:                    settings.Notifications,
		ProviderConfiguration:            settings.ProviderConfiguration,
		MachineDeploymentVMResourceQuota: settings.MachineDeploymentVMResourceQuota,
		MachineDeploymentOptions:         settings.MachineDeploymentOptions,
		AllowedOperatingSystems:          settings.AllowedOperatingSystems,
		DisableChangelogPopup:            settings.DisableChangelogPopup,
		WebTerminalOptions:               settings.WebTerminalOptions,
	}

	if settings.DefaultProjectResourceQuota != nil {
		crdQuota, err := apiv2.ConvertToCRDQuota(settings.DefaultProjectResourceQuota.Quota)
		if err != nil {
			return kubermaticv1.SettingSpec{}, err
		}
		s.DefaultProjectResourceQuota = &kubermaticv1.DefaultProjectResourceQuota{Quota: crdQuota}
	}

	return s, nil
}

func ConvertCRDSettingsToAPISettingsSpec(settings *kubermaticv1.SettingSpec) apiv2.GlobalSettings {
	enableShareCluster := true
	if settings.EnableShareCluster != nil {
		enableShareCluster = *settings.EnableShareCluster
	}
	s := apiv2.GlobalSettings{
		CustomLinks:                      settings.CustomLinks,
		DefaultNodeCount:                 settings.DefaultNodeCount,
		DisplayDemoInfo:                  settings.DisplayDemoInfo,
		DisplayAPIDocs:                   settings.DisplayAPIDocs,
		DisplayTermsOfService:            settings.DisplayTermsOfService,
		EnableDashboard:                  settings.EnableDashboard,
		EnableWebTerminal:                settings.EnableWebTerminal,
		EnableShareCluster:               enableShareCluster,
		EnableOIDCKubeconfig:             settings.EnableOIDCKubeconfig,
		EnableClusterBackups:             settings.EnableClusterBackups,
		EnableEtcdBackup:                 settings.EnableEtcdBackup,
		DisableAdminKubeconfig:           settings.DisableAdminKubeconfig,
		UserProjectsLimit:                settings.UserProjectsLimit,
		RestrictProjectCreation:          settings.RestrictProjectCreation,
		RestrictProjectDeletion:          settings.RestrictProjectDeletion,
		EnableExternalClusterImport:      settings.EnableExternalClusterImport,
		CleanupOptions:                   settings.CleanupOptions,
		OpaOptions:                       settings.OpaOptions,
		MlaOptions:                       settings.MlaOptions,
		MlaAlertmanagerPrefix:            settings.MlaAlertmanagerPrefix,
		MlaGrafanaPrefix:                 settings.MlaGrafanaPrefix,
		Notifications:                    settings.Notifications,
		ProviderConfiguration:            settings.ProviderConfiguration,
		MachineDeploymentVMResourceQuota: settings.MachineDeploymentVMResourceQuota,
		MachineDeploymentOptions:         settings.MachineDeploymentOptions,
		AllowedOperatingSystems:          settings.AllowedOperatingSystems,
		DisableChangelogPopup:            settings.DisableChangelogPopup,
		WebTerminalOptions:               settings.WebTerminalOptions,
	}

	if settings.DefaultProjectResourceQuota != nil {
		apiQuota := apiv2.ConvertToAPIQuota(settings.DefaultProjectResourceQuota.Quota)
		s.DefaultProjectResourceQuota = &apiv2.ProjectResourceQuota{
			Quota: apiQuota,
		}
	}

	return s
}
