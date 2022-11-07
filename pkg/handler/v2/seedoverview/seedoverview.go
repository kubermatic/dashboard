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
	"k8c.io/dashboard/v2/pkg/provider"
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

		clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
		clusterList, err := clusterProvider.ListAll(ctx, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		clustersByProvider := make(map[string]int)
		clustersByDatacenter := make(map[string]int)
		datacentersByProvider := make(map[string]int)

		for _, cluster := range clusterList.Items {
			providerName := cluster.Spec.Cloud.ProviderName
			if val, ok := clustersByProvider[providerName]; ok {
				clustersByProvider[providerName] = val + 1
			} else {
				clustersByProvider[providerName] = 1
			}

			if val, ok := datacentersByProvider[providerName]; ok {
				datacentersByProvider[providerName] = val + 1
			} else {
				datacentersByProvider[providerName] = 1
			}

			datacenterName := cluster.Spec.Cloud.DatacenterName
			if val, ok := clustersByDatacenter[datacenterName]; ok {
				clustersByDatacenter[datacenterName] = val + 1
			} else {
				clustersByDatacenter[datacenterName] = 1
			}
		}

		seedMap, err := seedsGetter()
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		seed, ok := seedMap[req.SeedName]
		if !ok {
			return nil, utilerrors.NewNotFound("Seed", req.SeedName)
		}

		return apiv2.SeedOverview{
			Name:                  seed.Name,
			Location:              seed.Spec.Location,
			Phase:                 seed.Status.Phase,
			Created:               seed.CreationTimestamp,
			Clusters:              seed.Status.Clusters,
			Providers:             len(clustersByProvider),
			Datacenters:           len(clustersByDatacenter),
			ClustersByDC:          clustersByDatacenter,
			ClustersByProvider:    clustersByProvider,
			DatacentersByProvider: datacentersByProvider,
		}, nil
	}
}
