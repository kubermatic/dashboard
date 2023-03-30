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

package openstack

import (
	"errors"
	"fmt"

	"github.com/gophercloud/gophercloud"
	goopenstack "github.com/gophercloud/gophercloud/openstack"
	osavailabilityzones "github.com/gophercloud/gophercloud/openstack/compute/v2/extensions/availabilityzones"
	osflavors "github.com/gophercloud/gophercloud/openstack/compute/v2/flavors"
	osprojects "github.com/gophercloud/gophercloud/openstack/identity/v3/projects"
	ostokens "github.com/gophercloud/gophercloud/openstack/identity/v3/tokens"
	osusers "github.com/gophercloud/gophercloud/openstack/identity/v3/users"
	osextnetwork "github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/external"
	ossecuritygroups "github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/security/groups"
	"github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/subnetpools"
	osnetworks "github.com/gophercloud/gophercloud/openstack/networking/v2/networks"
	ossubnets "github.com/gophercloud/gophercloud/openstack/networking/v2/subnets"
	"github.com/gophercloud/gophercloud/pagination"
)

func getSecurityGroups(netClient *gophercloud.ServiceClient, opts ossecuritygroups.ListOpts) ([]ossecuritygroups.SecGroup, error) {
	page, err := ossecuritygroups.List(netClient, opts).AllPages()
	if err != nil {
		return nil, fmt.Errorf("failed to list security groups: %w", err)
	}
	secGroups, err := ossecuritygroups.ExtractGroups(page)
	if err != nil {
		return nil, fmt.Errorf("failed to extract security groups: %w", err)
	}
	return secGroups, nil
}

// NetworkWithExternalExt is a struct that implements all networks.
type NetworkWithExternalExt struct {
	osnetworks.Network
	osextnetwork.NetworkExternalExt
}

func getAllNetworks(netClient *gophercloud.ServiceClient, opts osnetworks.ListOpts) ([]NetworkWithExternalExt, error) {
	var allNetworks []NetworkWithExternalExt
	allPages, err := osnetworks.List(netClient, opts).AllPages()
	if err != nil {
		return nil, err
	}

	if err = osnetworks.ExtractNetworksInto(allPages, &allNetworks); err != nil {
		return nil, err
	}

	return allNetworks, nil
}

func getAllSubnetPools(netClient *gophercloud.ServiceClient, listOpts subnetpools.ListOpts) ([]subnetpools.SubnetPool, error) {
	allPages, err := subnetpools.List(netClient, listOpts).AllPages()
	if err != nil {
		return nil, err
	}
	allSubnetPools, err := subnetpools.ExtractSubnetPools(allPages)
	if err != nil {
		return nil, err
	}
	return allSubnetPools, nil
}

func getFlavors(authClient *gophercloud.ProviderClient, region string) ([]osflavors.Flavor, error) {
	computeClient, err := goopenstack.NewComputeV2(authClient, gophercloud.EndpointOpts{Availability: gophercloud.AvailabilityPublic, Region: region})
	if err != nil {
		// this is special case for services that span only one region.
		if isEndpointNotFoundErr(err) {
			computeClient, err = goopenstack.NewComputeV2(authClient, gophercloud.EndpointOpts{})
			if err != nil {
				return nil, fmt.Errorf("couldn't get identity endpoint: %w", err)
			}
		} else {
			return nil, fmt.Errorf("couldn't get identity endpoint: %w", err)
		}
	}

	var allFlavors []osflavors.Flavor
	pager := osflavors.ListDetail(computeClient, osflavors.ListOpts{})
	err = pager.EachPage(func(page pagination.Page) (bool, error) {
		flavors, err := osflavors.ExtractFlavors(page)
		if err != nil {
			return false, err
		}
		allFlavors = append(allFlavors, flavors...)
		return true, nil
	})

	if err != nil {
		return nil, err
	}
	return allFlavors, nil
}

func getTenants(authClient *gophercloud.ProviderClient, region string) ([]osprojects.Project, error) {
	sc, err := goopenstack.NewIdentityV3(authClient, gophercloud.EndpointOpts{Region: region})
	if err != nil {
		// this is special case for services that span only one region.
		if isEndpointNotFoundErr(err) {
			sc, err = goopenstack.NewIdentityV3(authClient, gophercloud.EndpointOpts{})
			if err != nil {
				return nil, fmt.Errorf("couldn't get identity endpoint: %w", err)
			}
		} else {
			return nil, fmt.Errorf("couldn't get identity endpoint: %w", err)
		}
	}

	// We need to fetch the token to get more details - here we're just fetching the user object from the token response
	user, err := ostokens.Get(sc, sc.Token()).ExtractUser()
	if err != nil {
		return nil, fmt.Errorf("couldn't get user from token: %w", err)
	}

	// We cannot list all projects - instead we must list projects of a given user
	allPages, err := osusers.ListProjects(sc, user.ID).AllPages()
	if err != nil {
		return nil, fmt.Errorf("couldn't list tenants: %w", err)
	}

	allProjects, err := osprojects.ExtractProjects(allPages)
	if err != nil {
		return nil, fmt.Errorf("couldn't extract tenants: %w", err)
	}

	return allProjects, nil
}

func getSubnetForNetwork(netClient *gophercloud.ServiceClient, networkIDOrName string) ([]ossubnets.Subnet, error) {
	var allSubnets []ossubnets.Subnet

	networks, err := getAllNetworks(netClient, osnetworks.ListOpts{Name: networkIDOrName})
	if err != nil {
		return nil, fmt.Errorf("failed to list networks: %w", err)
	}

	networkID := networkIDOrName
	if len(networks) == 1 {
		networkID = networks[0].ID
	} else if len(networks) > 1 {
		return nil, fmt.Errorf("got %d networks for idOrName '%s', expected one at most", len(networks), networkIDOrName)
	}

	allPages, err := ossubnets.List(netClient, ossubnets.ListOpts{NetworkID: networkID}).AllPages()
	if err != nil {
		return nil, err
	}

	if allSubnets, err = ossubnets.ExtractSubnets(allPages); err != nil {
		return nil, err
	}

	return allSubnets, nil
}

func isEndpointNotFoundErr(err error) bool {
	var endpointNotFoundErr *gophercloud.ErrEndpointNotFound
	// left side of the || to catch any error returned as pointer to struct (current case of gophercloud)
	// right side of the || to catch any error returned as struct (in case...)
	return errors.As(err, &endpointNotFoundErr) || errors.As(err, &gophercloud.ErrEndpointNotFound{})
}

func getAvailabilityZones(computeClient *gophercloud.ServiceClient) ([]osavailabilityzones.AvailabilityZone, error) {
	allPages, err := osavailabilityzones.List(computeClient).AllPages()
	if err != nil {
		return nil, err
	}

	availabilityZones, err := osavailabilityzones.ExtractAvailabilityZones(allPages)
	if err != nil {
		return nil, err
	}

	return availabilityZones, nil
}
