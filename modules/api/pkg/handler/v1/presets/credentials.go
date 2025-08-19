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

package presets

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/ptr"
)

// providerNames holds a list of supported providers. Used for validation only.
// Field access is done using explicit switch cases for each provider.
var providerNames = []string{
	"digitalocean",
	"hetzner",
	"azure",
	"vsphere",
	"baremetal",
	"aws",
	"openstack",
	"gcp",
	"kubevirt",
	"alibaba",
	"anexia",
	"nutanix",
	"vmwareclouddirector",
}

// providerReq represents a request for provider name
// swagger:parameters listCredentials
type providerReq struct {
	// in: path
	// required: true
	ProviderName string `json:"provider_name"`
	// in: query
	Datacenter string `json:"datacenter,omitempty"`
}

// CredentialEndpoint returns custom credential list name for the provider.
func CredentialEndpoint(presetProvider provider.PresetProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(providerReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		err := req.Validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		credentials := apiv1.CredentialList{}
		names := make([]string, 0)

		presets, err := presetProvider.GetPresets(ctx, userInfo, ptr.To(""))
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, err.Error())
		}

		for _, preset := range presets {
			var hasProvider bool
			var datacenterValue string

			// check if preset has the requested provider and get datacenter value
			switch req.ProviderName {
			case "digitalocean":
				if preset.Spec.Digitalocean != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Digitalocean.Datacenter
				}
			case "hetzner":
				if preset.Spec.Hetzner != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Hetzner.Datacenter
				}
			case "azure":
				if preset.Spec.Azure != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Azure.Datacenter
				}
			case "vsphere":
				if preset.Spec.VSphere != nil {
					hasProvider = true
					datacenterValue = preset.Spec.VSphere.Datacenter
				}
			case "baremetal":
				if preset.Spec.Baremetal != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Baremetal.Datacenter
				}
			case "aws":
				if preset.Spec.AWS != nil {
					hasProvider = true
					datacenterValue = preset.Spec.AWS.Datacenter
				}
			case "openstack":
				if preset.Spec.Openstack != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Openstack.Datacenter
				}
			case "gcp":
				if preset.Spec.GCP != nil {
					hasProvider = true
					datacenterValue = preset.Spec.GCP.Datacenter
				}
			case "kubevirt":
				if preset.Spec.Kubevirt != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Kubevirt.Datacenter
				}
			case "alibaba":
				if preset.Spec.Alibaba != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Alibaba.Datacenter
				}
			case "anexia":
				if preset.Spec.Anexia != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Anexia.Datacenter
				}
			case "nutanix":
				if preset.Spec.Nutanix != nil {
					hasProvider = true
					datacenterValue = preset.Spec.Nutanix.Datacenter
				}
			case "vmwareclouddirector":
				if preset.Spec.VMwareCloudDirector != nil {
					hasProvider = true
					datacenterValue = preset.Spec.VMwareCloudDirector.Datacenter
				}
			}

			// append preset name if specific provider exists and datacenter matches
			if hasProvider && (datacenterValue == req.Datacenter || datacenterValue == "") {
				names = append(names, preset.Name)
			}
		}

		credentials.Names = names
		return credentials, nil
	}
}

func DecodeProviderReq(c context.Context, r *http.Request) (interface{}, error) {
	return providerReq{
		ProviderName: mux.Vars(r)["provider_name"],
		Datacenter:   r.URL.Query().Get("datacenter"),
	}, nil
}

// Validate validates providerReq request.
func (r providerReq) Validate() error {
	if len(r.ProviderName) == 0 {
		return fmt.Errorf("the provider name cannot be empty")
	}

	for _, existingProviders := range providerNames {
		if existingProviders == r.ProviderName {
			return nil
		}
	}
	return fmt.Errorf("invalid provider name %s", r.ProviderName)
}
