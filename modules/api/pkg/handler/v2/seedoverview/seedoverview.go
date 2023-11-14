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

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v1/dc"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
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

		if seed.Status.Phase != kubermaticv1.SeedInvalidPhase {
			// Creating a map of datacenters by provider based on the Seed object.
			for datacenterName, datacenter := range seed.Spec.Datacenters {
				spec, err := dc.ConvertInternalDCToExternalSpec(datacenter.DeepCopy(), seed.Name)
				if err != nil {
					log.Logger.Errorf("api spec error in dc %q: %v", datacenterName, err)
					continue
				}

				providerType, err := dc.GetProviderName(spec)
				if err != nil {
					log.Logger.Error(err)
					continue
				}

				if provider, ok := datacentersByProvider[string(providerType)]; ok {
					provider[datacenterName] = 0
				} else {
					// Creating a map of clusters by datacenter for each previously found provider type.
					// For now cluster number is initialised with 0, proper calculation takes place later on.
					datacentersByProvider[string(providerType)] = apiv2.ClustersByDatacenter{datacenterName: 0}
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
						// This code should execute only when a datacenter is removed
						// but some of its clusters are still running.
						datacenters[datacenterName] = 1
					}
				} else {
					// This code should execute only when all datacenters of a provider type are removed
					// but some of their clusters are still running.
					clustersByDatacenter := make(apiv2.ClustersByDatacenter)
					clustersByDatacenter[datacenterName] = 1
					datacentersByProvider[providerName] = clustersByDatacenter
				}
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

func ListSeedStatus(seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		seeds, err := seedsGetter()
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		seedStatusList := make([]apiv2.SeedStatus, 0, len(seeds))

		for _, seed := range seeds {
			seedStatusList = append(seedStatusList, apiv2.SeedStatus{
				Name:  seed.Name,
				Phase: seed.Status.Phase,
			})
		}

		return seedStatusList, nil
	}
}
