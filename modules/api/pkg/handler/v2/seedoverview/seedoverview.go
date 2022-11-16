/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package seedoverview

import (
	"context"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// swagger:parameters getSeedOverview
type getSeedOverviewReq struct {
	// in: path
	// required: true
	SeedName string `json:"seed_name"`
}

func (req getSeedOverviewReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		SeedName: req.SeedName,
	}
}

func DecodeGetSeedOverviewReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getSeedOverviewReq
	name := mux.Vars(r)["seed_name"]
	if name == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}
	req.SeedName = name
	return req, nil
}

func GetSeedOverview(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(getSeedOverviewReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, err
		}
		if !userInfo.IsAdmin {
			return nil, utilerrors.NewNotAuthorized()
		}

		datacentersByProvider := make(apiv2.DatacentersByProvider)

		seedMap, err := seedsGetter()
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		seed, ok := seedMap[req.SeedName]
		if !ok {
			return nil, utilerrors.NewNotFound("Seed", req.SeedName)
		}

		// Creating a map of datacenters by provider based on the Seed object.
		for dcName, dc := range seed.Spec.Datacenters {
			providerType := getProviderType(dcName, &dc)
			if providerType == "" {
				// Unsupported provider type.
				continue
			}
			if provider, ok := datacentersByProvider[string(providerType)]; ok {
				provider[dcName] = 0
			} else {
				// Creating a map of clusters by datacenter for each previously found provider type.
				// For now cluster number is initialised with 0. Proper calculation happens later on.
				datacentersByProvider[string(providerType)] = apiv2.ClustersByDatacenter{dcName: 0}
			}
		}

		clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
		clusterList, err := clusterProvider.ListAll(ctx, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		for _, cluster := range clusterList.Items {
			providerName := cluster.Spec.Cloud.ProviderName
			datacenterName := cluster.Spec.Cloud.DatacenterName

			if datacenters, ok := datacentersByProvider[providerName]; ok {
				if clustersByDatacenter, ok := datacenters[datacenterName]; ok {
					datacenters[datacenterName] = clustersByDatacenter + 1
				} else {
					// This code should not execute.
					// `clustersByDatacenter`` map was previously populated based on the Seed object.
					datacenters[datacenterName] = 1
				}
			} else {
				// This code should not execute.
				// `datacentersByProvider` map was previously populated based on the Seed object.
				clustersByDatacenter := make(apiv2.ClustersByDatacenter)
				clustersByDatacenter[datacenterName] = 1
				datacentersByProvider[providerName] = clustersByDatacenter
			}
		}

		return apiv2.SeedOverview{
			Name:                  seed.Name,
			Location:              seed.Spec.Location,
			Phase:                 seed.Status.Phase,
			Created:               seed.CreationTimestamp,
			DatacentersByProvider: datacentersByProvider,
		}, nil
	}
}

func getProviderValue(dcSpec *kubermaticv1.DatacenterSpec, providerType kubermaticv1.ProviderType) reflect.Value {
	spec := reflect.ValueOf(dcSpec).Elem()
	if spec.Kind() != reflect.Struct {
		return reflect.Value{}
	}

	ignoreCaseCompare := func(name string) bool {
		return strings.EqualFold(name, string(providerType))
	}

	provider := reflect.Indirect(spec).FieldByNameFunc(ignoreCaseCompare)
	if !provider.IsValid() {
		return reflect.Value{}
	}
	return provider
}

func hasProvider(dc *kubermaticv1.Datacenter, providerType kubermaticv1.ProviderType) (bool, reflect.Value) {
	provider := getProviderValue(&dc.Spec, providerType)
	return provider.IsValid() && !provider.IsZero(), provider
}

func getProviderType(dcName string, dc *kubermaticv1.Datacenter) kubermaticv1.ProviderType {
	for _, provType := range kubermaticv1.SupportedProviders {
		if hasProvider, _ := hasProvider(dc, provType); hasProvider {
			return provType
		}
	}
	return ""
}
