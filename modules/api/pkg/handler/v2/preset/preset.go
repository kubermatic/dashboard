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

package preset

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/common"
	v1common "k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	kubermaticv1helper "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1/helper"
	"k8c.io/kubermatic/v2/pkg/log"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
)

// listPresetsReq represents a request for a list of presets
// swagger:parameters listPresets
type listPresetsReq struct {
	// in: query
	Disabled bool   `json:"disabled,omitempty"`
	Name     string `json:"name,omitempty"`
}

// listProjectPresetsReq represents a request for a list of presets in a specific project
// swagger:parameters listProjectPresets
type listProjectPresetsReq struct {
	v1common.ProjectReq
	listPresetsReq
}

func DecodeListPresets(_ context.Context, r *http.Request) (interface{}, error) {
	return listPresetsReq{
		Disabled: r.URL.Query().Get("disabled") == "true",
		Name:     r.URL.Query().Get("name"),
	}, nil
}

func DecodeListProjectPresets(ctx context.Context, r *http.Request) (interface{}, error) {
	listReq, err := DecodeListPresets(ctx, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := v1common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	return listProjectPresetsReq{
		listPresetsReq: listReq.(listPresetsReq),
		ProjectReq:     projectReq.(v1common.ProjectReq),
	}, nil
}

// ListPresets returns a list of presets.
func ListPresets(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(listPresetsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		presetList := &apiv2.PresetList{Items: make([]apiv2.Preset, 0)}
		presets, err := presetProvider.GetPresets(ctx, userInfo, nil)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		for _, preset := range presets {
			// skip presets limited to projects unless an admin is requesting this information
			if len(preset.Spec.Projects) > 0 && !userInfo.IsAdmin {
				continue
			}

			enabled := preset.Spec.IsEnabled()

			if !preset.Spec.IsEnabled() && !req.Disabled {
				continue
			}

			presetList.Items = append(presetList.Items, newAPIPreset(&preset, enabled))
		}

		return presetList, nil
	}
}

// ListProjectPresets returns a list of presets for a specific project.
func ListProjectPresets(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(listProjectPresetsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, req.ProjectID)
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if req.Name != "" {
			preset, err := presetProvider.GetPreset(ctx, userInfo, &req.ProjectID, req.Name)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
			}
			if !preset.Spec.IsEnabled() && !req.Disabled {
				return nil, nil
			}
			return newAPIPreset(preset, preset.Spec.IsEnabled()), nil
		}
		presetList := &apiv2.PresetList{Items: make([]apiv2.Preset, 0)}
		presets, err := presetProvider.GetPresets(ctx, userInfo, &req.ProjectID)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		for _, preset := range presets {
			enabled := preset.Spec.IsEnabled()

			if !preset.Spec.IsEnabled() && !req.Disabled {
				continue
			}

			presetList.Items = append(presetList.Items, newAPIPreset(&preset, enabled))
		}

		return presetList, nil
	}
}

// updatePresetStatusReq represents a request to update preset status
// swagger:parameters updatePresetStatus
type updatePresetStatusReq struct {
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
	// in: query
	Provider string `json:"provider,omitempty"`
	// in: body
	// required: true
	Body struct {
		Enabled bool `json:"enabled"`
	}
}

func DecodeUpdatePresetStatus(_ context.Context, r *http.Request) (interface{}, error) {
	var req updatePresetStatusReq

	req.PresetName = mux.Vars(r)["preset_name"]
	req.Provider = r.URL.Query().Get("provider")
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

// Validate validates updatePresetStatusReq request.
func (r updatePresetStatusReq) Validate() error {
	if len(r.PresetName) == 0 {
		return fmt.Errorf("the preset name cannot be empty")
	}

	if len(r.Provider) > 0 && !kubermaticv1.IsProviderSupported(r.Provider) {
		return fmt.Errorf("invalid provider name %s", r.Provider)
	}

	return nil
}

// UpdatePresetStatus updates the status of a preset. It can enable or disable it, so that it won't be listed by the list endpoints.
func UpdatePresetStatus(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(updatePresetStatusReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, "only admins can update presets")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		if len(req.Provider) == 0 {
			preset.Spec.SetEnabled(req.Body.Enabled)
			_, err = presetProvider.UpdatePreset(ctx, preset)
			return nil, err
		}

		if hasProvider, _ := common.PresetHasProvider(preset, kubermaticv1.ProviderType(req.Provider)); !hasProvider {
			return nil, utilerrors.New(http.StatusConflict, fmt.Sprintf("trying to update preset with missing provider configuration for: %s", req.Provider))
		}

		common.SetPresetProviderEnabled(preset, kubermaticv1.ProviderType(req.Provider), req.Body.Enabled)
		_, err = presetProvider.UpdatePreset(ctx, preset)
		return nil, err
	}
}

// listProviderPresetsReq represents a request for a list of presets
// swagger:parameters listProviderPresets
type listProviderPresetsReq struct {
	listPresetsReq `json:",inline"`

	// in: path
	// required: true
	ProviderName string `json:"provider_name"`
	// in: query
	Datacenter string `json:"datacenter,omitempty"`
}

// listProjectProviderPresetsReq represents a request for a list of presets for a specific project
// swagger:parameters listProjectProviderPresets
type listProjectProviderPresetsReq struct {
	v1common.ProjectReq
	listProviderPresetsReq
}

func (l listProviderPresetsReq) matchesDatacenter(datacenter string) bool {
	return len(datacenter) == 0 || len(l.Datacenter) == 0 || strings.EqualFold(l.Datacenter, datacenter)
}

// Validate validates listProviderPresetsReq request.
func (l listProviderPresetsReq) Validate() error {
	if len(l.ProviderName) == 0 {
		return fmt.Errorf("the provider name cannot be empty")
	}

	if !kubermaticv1.IsProviderSupported(l.ProviderName) {
		return fmt.Errorf("invalid provider name %s", l.ProviderName)
	}

	return nil
}

func DecodeListProviderPresets(ctx context.Context, r *http.Request) (interface{}, error) {
	listReq, err := DecodeListPresets(ctx, r)
	if err != nil {
		return nil, err
	}

	return listProviderPresetsReq{
		listPresetsReq: listReq.(listPresetsReq),
		ProviderName:   mux.Vars(r)["provider_name"],
		Datacenter:     r.URL.Query().Get("datacenter"),
	}, nil
}

func DecodeListProjectProviderPresets(ctx context.Context, r *http.Request) (interface{}, error) {
	listReq, err := DecodeListProviderPresets(ctx, r)
	if err != nil {
		return nil, err
	}

	projectReq, err := v1common.DecodeProjectRequest(ctx, r)
	if err != nil {
		return nil, err
	}

	return listProjectProviderPresetsReq{
		listProviderPresetsReq: listReq.(listProviderPresetsReq),
		ProjectReq:             projectReq.(v1common.ProjectReq),
	}, nil
}

// ListProviderPresets returns a list of preset names for the provider.
func ListProviderPresets(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(listProviderPresetsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		presetList := &apiv2.PresetList{Items: make([]apiv2.Preset, 0)}
		presets, err := presetProvider.GetPresets(ctx, userInfo, nil)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		for _, preset := range presets {
			// skip presets limited to projects unless an admin is requesting this information
			if len(preset.Spec.Projects) > 0 && !userInfo.IsAdmin {
				continue
			}

			providerType := kubermaticv1.ProviderType(req.ProviderName)
			providerPreset := common.GetProviderPreset(&preset, providerType)

			// Preset does not contain requested provider configuration
			if providerPreset == nil {
				continue
			}

			// Preset does not contain requested datacenter
			if !req.matchesDatacenter(providerPreset.Datacenter) {
				continue
			}

			// Skip disabled presets when not requested
			enabled := preset.Spec.IsEnabled() && providerPreset.IsEnabled()
			if !req.Disabled && !enabled {
				continue
			}

			presetList.Items = append(presetList.Items, newAPIPreset(&preset, enabled))
		}

		return presetList, nil
	}
}

// ListProjectProviderPresets returns a list of presets for a specific provider in a specific project.
func ListProjectProviderPresets(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(listProjectProviderPresetsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, req.ProjectID)
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		presetList := &apiv2.PresetList{Items: make([]apiv2.Preset, 0)}
		presets, err := presetProvider.GetPresets(ctx, userInfo, &req.ProjectID)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		for _, preset := range presets {
			providerType := kubermaticv1.ProviderType(req.ProviderName)
			providerPreset := common.GetProviderPreset(&preset, providerType)

			// Preset does not contain requested provider configuration
			if providerPreset == nil {
				continue
			}

			// Preset does not contain requested datacenter
			if !req.matchesDatacenter(providerPreset.Datacenter) {
				continue
			}

			// Skip disabled presets when not requested
			enabled := preset.Spec.IsEnabled() && providerPreset.IsEnabled()
			if !req.Disabled && !enabled {
				continue
			}

			presetList.Items = append(presetList.Items, newAPIPreset(&preset, enabled))
		}

		return presetList, nil
	}
}

// createPresetReq represents a request to create a new preset
// swagger:parameters createPreset
type createPresetReq struct {
	// in: path
	// required: true
	ProviderName string `json:"provider_name"`
	// in: body
	// required: true
	Body apiv2.PresetBody
}

// Validate validates createPresetReq request.
func (r createPresetReq) Validate() error {
	if len(r.ProviderName) == 0 {
		return fmt.Errorf("the provider name cannot be empty")
	}

	if !kubermaticv1.IsProviderSupported(r.ProviderName) {
		return fmt.Errorf("invalid provider name %s", r.ProviderName)
	}

	if len(r.Body.Name) == 0 {
		return fmt.Errorf("preset name cannot be empty")
	}

	if hasProvider, _ := common.PresetHasProvider(convertAPIToInternalPreset(r.Body), kubermaticv1.ProviderType(r.ProviderName)); !hasProvider {
		return fmt.Errorf("missing provider configuration for: %s", r.ProviderName)
	}

	err := common.ValidatePreset(convertAPIToInternalPreset(r.Body), kubermaticv1.ProviderType(r.ProviderName))
	if err != nil {
		return err
	}

	for _, providerType := range kubermaticv1.SupportedProviders {
		if string(providerType) == r.ProviderName {
			continue
		}

		if hasProvider, _ := common.PresetHasProvider(convertAPIToInternalPreset(r.Body), providerType); hasProvider {
			return fmt.Errorf("found unexpected provider configuration for: %s", providerType)
		}
	}

	return nil
}

func DecodeCreatePreset(_ context.Context, r *http.Request) (interface{}, error) {
	var req createPresetReq

	req.ProviderName = mux.Vars(r)["provider_name"]
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

// CreatePreset creates a preset for the selected provider and returns the name if successful, error otherwise.
func CreatePreset(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(createPresetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return "", utilerrors.New(http.StatusForbidden, "only admins can update presets")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.Body.Name)
		if apierrors.IsNotFound(err) {
			return presetProvider.CreatePreset(ctx, convertAPIToInternalPreset(req.Body))
		}

		if err != nil && !apierrors.IsNotFound(err) {
			return nil, err
		}

		if hasProvider, _ := common.PresetHasProvider(preset, kubermaticv1.ProviderType(req.ProviderName)); hasProvider {
			return nil, utilerrors.New(http.StatusConflict, fmt.Sprintf("%s provider configuration already exists for preset %s", req.ProviderName, preset.Name))
		}

		preset = mergePresets(preset, convertAPIToInternalPreset(req.Body), kubermaticv1.ProviderType(req.ProviderName))
		preset, err = presetProvider.UpdatePreset(ctx, preset)
		if err != nil {
			return nil, err
		}

		providerType := kubermaticv1.ProviderType(req.ProviderName)
		enabled := preset.Spec.IsEnabled() && common.IsPresetProviderEnabled(preset, providerType)
		return newAPIPreset(preset, enabled), nil
	}
}

// updatePresetReq represents a request to update a preset
// swagger:parameters updatePreset
type updatePresetReq struct {
	createPresetReq
}

// Validate validates updatePresetReq request.
func (r updatePresetReq) Validate() error {
	return r.createPresetReq.Validate()
}

func DecodeUpdatePreset(_ context.Context, r *http.Request) (interface{}, error) {
	var req updatePresetReq

	req.ProviderName = mux.Vars(r)["provider_name"]
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

// UpdatePreset updates a preset for the selected provider and returns the name if successful, error otherwise.
func UpdatePreset(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(updatePresetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return "", utilerrors.New(http.StatusForbidden, "only admins can update presets")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.Body.Name)
		if err != nil {
			return nil, err
		}

		preset = mergePresets(preset, convertAPIToInternalPreset(req.Body), kubermaticv1.ProviderType(req.ProviderName))
		preset, err = presetProvider.UpdatePreset(ctx, preset)
		if err != nil {
			return nil, err
		}

		providerType := kubermaticv1.ProviderType(req.ProviderName)
		enabled := preset.Spec.IsEnabled() && common.IsPresetProviderEnabled(preset, providerType)
		return newAPIPreset(preset, enabled), nil
	}
}

// deletePresetReq represents a request to delete a preset
// swagger:parameters deletePreset
type deletePresetReq struct {
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
}

// Validate validates deletePresetReq request.
func (r deletePresetReq) Validate() error {
	if len(r.PresetName) == 0 {
		return fmt.Errorf("preset name cannot be empty")
	}
	return nil
}

func DecodeDeletePreset(_ context.Context, r *http.Request) (interface{}, error) {
	var req deletePresetReq

	req.PresetName = mux.Vars(r)["preset_name"]

	return req, nil
}

// DeletePreset deletes preset.
func DeletePreset(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(deletePresetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return "", utilerrors.New(http.StatusForbidden, "only admins can delete presets")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if apierrors.IsNotFound(err) {
			return nil, utilerrors.NewNotFound("Preset", "preset was not found.")
		}

		if err != nil && !apierrors.IsNotFound(err) {
			return nil, err
		}

		_, err = presetProvider.DeletePreset(ctx, preset)

		return nil, err
	}
}

// deletePresetProviderReq represents a request to delete preset provider
// swagger:parameters deletePresetProvider
type deletePresetProviderReq struct {
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
	// in: path
	// required: true
	ProviderName string `json:"provider_name,omitempty"`
}

func DecodeDeletePresetProvider(_ context.Context, r *http.Request) (interface{}, error) {
	var req deletePresetProviderReq

	req.PresetName = mux.Vars(r)["preset_name"]
	req.ProviderName = mux.Vars(r)["provider_name"]

	return req, nil
}

// Validate validates deletePresetProviderReq request.
func (r deletePresetProviderReq) Validate() error {
	if len(r.PresetName) == 0 {
		return fmt.Errorf("the preset name cannot be empty")
	}

	if len(r.ProviderName) == 0 {
		return fmt.Errorf("the provider name cannot be empty")
	}

	if !kubermaticv1.IsProviderSupported(r.ProviderName) {
		return fmt.Errorf("invalid provider name %s", r.ProviderName)
	}

	return nil
}

func DeletePresetProvider(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(deletePresetProviderReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return nil, utilerrors.New(http.StatusForbidden, "only admins can delete preset providers")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if apierrors.IsNotFound(err) {
			return nil, utilerrors.NewNotFound("Preset", "preset was not found.")
		}

		if err != nil && !apierrors.IsNotFound(err) {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		providerName := kubermaticv1.ProviderType(req.ProviderName)
		if hasProvider, _ := common.PresetHasProvider(preset, providerName); !hasProvider {
			return nil, utilerrors.NewNotFound("Preset", fmt.Sprintf("preset %s does not contain %s provider", req.PresetName, req.ProviderName))
		}

		preset = common.RemovePresetProvider(preset, providerName)
		_, err = presetProvider.UpdatePreset(ctx, preset)

		return preset, err
	}
}

// deleteProviderPresetReq represents a request to delete a preset or one of its providers
// swagger:parameters deleteProviderPreset
type deleteProviderPresetReq struct {
	// in: path
	// required: true
	ProviderName string `json:"provider_name"`
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
}

// Validate validates deleteProviderPresetReq request.
func (r deleteProviderPresetReq) Validate() error {
	if len(r.ProviderName) == 0 {
		return fmt.Errorf("the provider name cannot be empty")
	}

	if !kubermaticv1.IsProviderSupported(r.ProviderName) {
		return fmt.Errorf("invalid provider name %s", r.ProviderName)
	}

	if len(r.PresetName) == 0 {
		return fmt.Errorf("preset name cannot be empty")
	}
	return nil
}

func DecodeDeleteProviderPreset(_ context.Context, r *http.Request) (interface{}, error) {
	var req deleteProviderPresetReq

	req.ProviderName = mux.Vars(r)["provider_name"]
	req.PresetName = mux.Vars(r)["preset_name"]

	return req, nil
}

// DeleteProviderPreset deletes the given provider from the preset AND if there is only one provider left, the preset gets deleted.
// Deprecated: This function has been deprecated; use DeletePreset or DeletePresetProvider.
func DeleteProviderPreset(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(deleteProviderPresetReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		if !userInfo.IsAdmin {
			return "", utilerrors.New(http.StatusForbidden, "only admins can delete presets")
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if apierrors.IsNotFound(err) {
			return nil, utilerrors.NewBadRequest("preset was not found.")
		}

		if err != nil && !apierrors.IsNotFound(err) {
			return nil, err
		}

		// remove provider from preset
		preset = common.RemovePresetProvider(preset, kubermaticv1.ProviderType(req.ProviderName))

		existingProviders := common.GetPresetProviderList(preset)
		if len(existingProviders) > 0 {
			// Case: Remove provider from the preset
			preset, err = presetProvider.UpdatePreset(ctx, preset)
			if err != nil {
				return nil, err
			}
		} else {
			preset, err = presetProvider.DeletePreset(ctx, preset)
			if err != nil {
				return nil, err
			}
		}

		enabled := preset.Spec.IsEnabled()
		return newAPIPreset(preset, enabled), nil
	}
}

// getPresetSatsReq represents a request to get preset stats
// swagger:parameters getPresetStats
type getPresetSatsReq struct {
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
}

// Validate validates getPresetSatsReq request.
func (r getPresetSatsReq) Validate() error {
	if len(r.PresetName) == 0 {
		return fmt.Errorf("preset name cannot be empty")
	}
	return nil
}

func DecodeGetPresetStats(_ context.Context, r *http.Request) (interface{}, error) {
	var req getPresetSatsReq

	req.PresetName = mux.Vars(r)["preset_name"]

	return req, nil
}

// GetPresetStats gets preset stats with detailed cluster and template information.
func GetPresetStats(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter, clusterTemplateProvider provider.ClusterTemplateProvider, projectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(getPresetSatsReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if err != nil {
			if apierrors.IsNotFound(err) {
				return nil, utilerrors.NewBadRequest("preset was not found.")
			}
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		stats := apiv2.PresetStats{}

		seeds, err := seedsGetter()
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("failed to list seeds: %v", err))
		}
		presetLabelRequirement, err := labels.NewRequirement(kubermaticv1.IsCredentialPresetLabelKey, selection.Equals, []string{"true"})
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		// Iterate through all seeds to find clusters associated with this preset
		for seedName, seed := range seeds {
			// Skip seeds that are in an invalid phase as they cannot be processed
			if seed.Status.Phase == kubermaticv1.SeedInvalidPhase {
				log.Logger.Warnf("skipping seed %s as it is in an invalid phase", seedName)
				continue
			}

			// Get the cluster provider for this specific seed
			clusterProvider, err := clusterProviderGetter(seed)
			if err != nil {
				// If we can't get a cluster provider for a seed, log the error but continue
				// processing other seeds to provide partial results rather than failing entirely
				log.Logger.Warnw("error getting cluster provider", "seed", seedName, "error", err)
				continue
			}
			
			// Handle regular clusters
			// List all clusters that have the credential preset label set to "true"
			// This filters clusters to only those that use credential presets
			clusters, err := clusterProvider.ListAll(ctx, labels.NewSelector().Add(*presetLabelRequirement))
			if err != nil {
				log.Logger.Warnw("failed to list regular clusters", "seed", seedName, "error", err)
				continue
			}
			
			// Check each cluster to see if it's associated with our specific preset
			for _, cluster := range clusters.Items {
				if cluster.Annotations != nil {
					// Look for the preset name annotation and compare it to our preset
					if presetName := cluster.Annotations[kubermaticv1.PresetNameAnnotation]; presetName == preset.Name {
						stats.AssociatedClusters++
					}
				}
			}
		}

		// Handle cluster templates
		templates, err := clusterTemplateProvider.ListALL(ctx, labels.NewSelector().Add(*presetLabelRequirement))
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}
		for _, template := range templates {
			if template.Annotations != nil {
				if presetName := template.Annotations[kubermaticv1.PresetNameAnnotation]; presetName == preset.Name { 
					stats.AssociatedClusterTemplates++
				}
			}
		}

		return stats, nil
	}
}

// getPresetLinkagesReq represents a request for preset linkages
// swagger:parameters getPresetLinkages
type getPresetLinkagesReq struct {
	// in: path
	// required: true
	PresetName string `json:"preset_name"`
}

func (r getPresetLinkagesReq) Validate() error {
	if len(r.PresetName) == 0 {
		return fmt.Errorf("the preset name cannot be empty")
	}
	return nil
}

func DecodeGetPresetLinkages(_ context.Context, r *http.Request) (interface{}, error) {
	return getPresetLinkagesReq{
		PresetName: mux.Vars(r)["preset_name"],
	}, nil
}

// GetPresetLinkages returns detailed linkage information for a preset
func GetPresetLinkages(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter, clusterTemplateProvider provider.ClusterTemplateProvider, projectProvider provider.PrivilegedProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(getPresetLinkagesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		preset, err := presetProvider.GetPreset(ctx, userInfo, nil, req.PresetName)
		if err != nil {
			if apierrors.IsNotFound(err) {
				return nil, utilerrors.NewBadRequest("preset was not found.")
			}
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		linkages := apiv2.PresetLinkages{
			PresetName:       preset.Name,
			Clusters:         []apiv2.ClusterAssociation{},
			ClusterTemplates: []apiv2.ClusterTemplateAssociation{},
		}

		seeds, err := seedsGetter()
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("failed to list seeds: %v", err))
		}
		presetLabelRequirement, err := labels.NewRequirement(kubermaticv1.IsCredentialPresetLabelKey, selection.Equals, []string{"true"})
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}

		// Iterate through all seeds to find clusters associated with this preset
		for seedName, seed := range seeds {
			// Skip seeds that are in an invalid phase as they cannot be processed
			if seed.Status.Phase == kubermaticv1.SeedInvalidPhase {
				log.Logger.Warnf("skipping seed %s as it is in an invalid phase", seedName)
				continue
			}

			// Get the cluster provider for this specific seed
			clusterProvider, err := clusterProviderGetter(seed)
			if err != nil {
				// If we can't get a cluster provider for a seed, log the error but continue
				// processing other seeds to provide partial results rather than failing entirely
				log.Logger.Warnw("error getting cluster provider", "seed", seedName, "error", err)
				continue
			}
			
			// List all clusters that have the credential preset label set to "true"
			// This filters clusters to only those that use credential presets
			clusters, err := clusterProvider.ListAll(ctx, labels.NewSelector().Add(*presetLabelRequirement))
			if err != nil {
				log.Logger.Warnw("failed to list clusters", "seed", seedName, "error", err)
				continue
			}
			
			// Check each cluster to see if it's associated with our specific preset
			for _, cluster := range clusters.Items {
				if cluster.Annotations != nil {
					if presetName := cluster.Annotations[kubermaticv1.PresetNameAnnotation]; presetName == preset.Name {
						project, err := projectProvider.GetUnsecured(ctx, cluster.Labels[kubermaticv1.ProjectIDLabelKey], nil)
						if err != nil {
							log.Logger.Warnw("failed to get project for cluster", "cluster", cluster.Name, "project", cluster.Labels[kubermaticv1.ProjectIDLabelKey], "error", err)
							continue
						}

						// Determine provider name
						provider, err := kubermaticv1helper.ClusterCloudProviderName(cluster.Spec.Cloud)
						if err != nil {
							provider = "unknown"
						}

						clusterAssociation := apiv2.ClusterAssociation{
							ClusterID:         cluster.Name,
							ClusterName:       cluster.Spec.HumanReadableName,
							ProjectID:         project.Name,
							ProjectName:       project.Spec.Name,
							Provider:          provider,
						}

						// Set datacenter if available
						if cluster.Spec.Cloud.DatacenterName != "" {
							clusterAssociation.Datacenter = cluster.Spec.Cloud.DatacenterName
						}

						linkages.Clusters = append(linkages.Clusters, clusterAssociation)
					}
				}
			}
		}

		// Handle cluster templates
		templates, err := clusterTemplateProvider.ListALL(ctx, labels.NewSelector().Add(*presetLabelRequirement))
		if err != nil {
			return nil, v1common.KubernetesErrorToHTTPError(err)
		}
		for _, template := range templates {
			if template.Annotations != nil {
				if presetName := template.Annotations[kubermaticv1.PresetNameAnnotation]; presetName == preset.Name { 
					// Get project information if template is project-scoped
					var project *kubermaticv1.Project
					var projectName string
					if template.Labels != nil {
						if projectID := template.Labels[kubermaticv1.ProjectIDLabelKey]; projectID != "" {
							project, err = projectProvider.GetUnsecured(ctx, projectID, nil)
							if err != nil {
								log.Logger.Warnw("failed to get project for cluster template", "template", template.Name, "project", projectID, "error", err)
								projectName = projectID // fallback to project ID
							} else {
								projectName = project.Spec.Name
							}
						}
					}

					// Determine provider name
					provider, err := kubermaticv1helper.ClusterCloudProviderName(template.Spec.Cloud)
					if err != nil {
						provider = "unknown"
					}

					templateAssociation := apiv2.ClusterTemplateAssociation{
						TemplateID:        template.Name,
						TemplateName:      template.Spec.HumanReadableName,
						ProjectID:         template.Labels[kubermaticv1.ProjectIDLabelKey],
						ProjectName:       projectName,
						Provider:          provider,
					}

					// Set datacenter if available
					if template.Spec.Cloud.DatacenterName != "" {
						templateAssociation.Datacenter = template.Spec.Cloud.DatacenterName
					}

					linkages.ClusterTemplates = append(linkages.ClusterTemplates, templateAssociation)
				}
			}
		}

		return linkages, nil
	}
}

func mergePresets(oldPreset *kubermaticv1.Preset, newPreset *kubermaticv1.Preset, providerType kubermaticv1.ProviderType) *kubermaticv1.Preset {
	oldPreset = common.OverridePresetProvider(oldPreset, providerType, newPreset)
	oldPreset.Spec.RequiredEmails = newPreset.Spec.RequiredEmails
	return oldPreset
}

func newAPIPreset(preset *kubermaticv1.Preset, enabled bool) apiv2.Preset {
	providers := make([]apiv2.PresetProvider, 0)
	for _, providerType := range kubermaticv1.SupportedProviders {
		if hasProvider, _ := common.PresetHasProvider(preset, providerType); hasProvider {
			provider := apiv2.PresetProvider{
				Name:    providerType,
				Enabled: common.IsPresetProviderEnabled(preset, providerType),
			}
			if providerType == kubermaticv1.VMwareCloudDirectorCloudProvider && preset.Spec.VMwareCloudDirector != nil {
				if preset.Spec.VMwareCloudDirector.OVDCNetworks != nil {
					provider.VMwareCloudDirector = &apiv2.VMwareCloudDirectorAPIPreset{
						OVDCNetworks: preset.Spec.VMwareCloudDirector.OVDCNetworks,
					}
				} else {
					provider.VMwareCloudDirector = &apiv2.VMwareCloudDirectorAPIPreset{
						OVDCNetwork: preset.Spec.VMwareCloudDirector.OVDCNetwork,
					}
				}
			}

			if providerType == kubermaticv1.OpenstackCloudProvider && preset.Spec.Openstack != nil {
				provider.IsCustomizable = preset.Spec.Openstack.IsCustomizable
				if provider.IsCustomizable {
					provider.OpenStack = &apiv2.OpenStackAPIPreset{
						Network:        preset.Spec.Openstack.Network,
						SecurityGroups: preset.Spec.Openstack.SecurityGroups,
						FloatingIPPool: preset.Spec.Openstack.FloatingIPPool,
						RouterID:       preset.Spec.Openstack.RouterID,
						SubnetID:       preset.Spec.Openstack.SubnetID,
					}
				}
			}

			providers = append(providers, provider)
		}
	}

	return apiv2.Preset{Name: preset.Name, Enabled: enabled, Providers: providers}
}

func convertAPIToInternalPreset(preset apiv2.PresetBody) *kubermaticv1.Preset {
	return &kubermaticv1.Preset{
		ObjectMeta: metav1.ObjectMeta{
			Name: preset.Name,
		},
		Spec: preset.Spec,
	}
}
