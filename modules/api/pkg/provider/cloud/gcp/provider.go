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

package gcp

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"

	"go.uber.org/zap"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/compute/v1"
	"google.golang.org/api/option"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
	"k8c.io/kubermatic/v2/pkg/resources"
)

type gcp struct {
	secretKeySelector provider.SecretKeySelectorValueFunc
	log               *zap.SugaredLogger
}

// NewCloudProvider creates a new gcp provider.
func NewCloudProvider(secretKeyGetter provider.SecretKeySelectorValueFunc) provider.CloudProvider {
	return &gcp{
		secretKeySelector: secretKeyGetter,
		log:               log.Logger,
	}
}

var _ provider.CloudProvider = &gcp{}

func ValidateCredentials(ctx context.Context, serviceAccount string) error {
	svc, project, err := ConnectToComputeService(ctx, serviceAccount)
	if err != nil {
		return err
	}
	req := svc.Regions.List(project)
	err = req.Pages(ctx, func(list *compute.RegionList) error {
		return nil
	})
	return err
}

// ConnectToComputeService establishes a service connection to the Compute Engine.
func ConnectToComputeService(ctx context.Context, serviceAccount string) (*compute.Service, string, error) {
	client, projectID, err := createClient(ctx, serviceAccount, compute.ComputeScope)
	if err != nil {
		return nil, "", fmt.Errorf("cannot create Google Cloud client: %w", err)
	}
	svc, err := compute.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, "", fmt.Errorf("cannot connect to Google Cloud: %w", err)
	}
	return svc, projectID, nil
}

func createClient(ctx context.Context, serviceAccount string, scope string) (*http.Client, string, error) {
	b, err := base64.StdEncoding.DecodeString(serviceAccount)
	if err != nil {
		return nil, "", fmt.Errorf("error decoding service account: %w", err)
	}
	sam := map[string]string{}
	err = json.Unmarshal(b, &sam)
	if err != nil {
		return nil, "", fmt.Errorf("failed unmarshalling service account: %w", err)
	}

	projectID := sam["project_id"]
	if projectID == "" {
		return nil, "", errors.New("empty project_id")
	}
	conf, err := google.JWTConfigFromJSON(b, scope)
	if err != nil {
		return nil, "", err
	}

	client := conf.Client(ctx)

	return client, projectID, nil
}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (serviceAccount string, err error) {
	serviceAccount = cloud.GCP.ServiceAccount

	if serviceAccount == "" {
		if cloud.GCP.CredentialsReference == nil {
			return "", errors.New("no credentials provided")
		}
		serviceAccount, err = secretKeySelector(cloud.GCP.CredentialsReference, resources.GCPServiceAccount)
		if err != nil {
			return "", err
		}
	}

	return serviceAccount, nil
}

func GetGCPNetwork(ctx context.Context, sa, networkName string) (apiv1.GCPNetwork, error) {
	computeService, project, err := ConnectToComputeService(ctx, sa)
	if err != nil {
		return apiv1.GCPNetwork{}, err
	}

	req := computeService.Networks.Get(project, networkName)
	network, err := req.Do()
	if err != nil {
		return apiv1.GCPNetwork{}, err
	}

	return ToGCPNetworkAPIModel(network), nil
}

var networkRegex = regexp.MustCompile(`(global\/.+)$`)

func ToGCPNetworkAPIModel(network *compute.Network) apiv1.GCPNetwork {
	networkPath := networkRegex.FindString(network.SelfLink)
	return apiv1.GCPNetwork{
		ID:                    network.Id,
		Name:                  network.Name,
		AutoCreateSubnetworks: network.AutoCreateSubnetworks,
		Subnetworks:           network.Subnetworks,
		Kind:                  network.Kind,
		Path:                  networkPath,
	}
}

// GCPSubnetworkGetter is a function to retrieve a single subnetwork.
type GCPSubnetworkGetter = func(ctx context.Context, sa, region, subnetworkName string) (apiv1.GCPSubnetwork, error)

func GetGCPSubnetwork(ctx context.Context, sa, region, subnetworkName string) (apiv1.GCPSubnetwork, error) {
	computeService, project, err := ConnectToComputeService(ctx, sa)
	if err != nil {
		return apiv1.GCPSubnetwork{}, err
	}

	req := computeService.Subnetworks.Get(project, region, subnetworkName)
	subnetwork, err := req.Do()
	if err != nil {
		return apiv1.GCPSubnetwork{}, err
	}

	return ToGCPSubnetworkAPIModel(subnetwork), nil
}

var subnetworkRegex = regexp.MustCompile(`(projects\/.+)$`)

func ToGCPSubnetworkAPIModel(subnetwork *compute.Subnetwork) apiv1.GCPSubnetwork {
	subnetworkPath := subnetworkRegex.FindString(subnetwork.SelfLink)
	net := apiv1.GCPSubnetwork{
		ID:                    subnetwork.Id,
		Name:                  subnetwork.Name,
		Network:               subnetwork.Network,
		IPCidrRange:           subnetwork.IpCidrRange,
		GatewayAddress:        subnetwork.GatewayAddress,
		Region:                subnetwork.Region,
		SelfLink:              subnetwork.SelfLink,
		PrivateIPGoogleAccess: subnetwork.PrivateIpGoogleAccess,
		Kind:                  subnetwork.Kind,
		Path:                  subnetworkPath,
	}

	switch subnetwork.StackType {
	case "IPV4_ONLY":
		net.IPFamily = kubermaticv1.IPFamilyIPv4
	case "IPV4_IPV6":
		net.IPFamily = kubermaticv1.IPFamilyDualStack
	default:
		net.IPFamily = kubermaticv1.IPFamilyUnspecified
	}

	return net
}
