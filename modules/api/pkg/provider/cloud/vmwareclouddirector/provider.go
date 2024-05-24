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

package vmwareclouddirector

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
)

type Provider struct {
	dc                *kubermaticv1.DatacenterSpecVMwareCloudDirector
	secretKeySelector provider.SecretKeySelectorValueFunc
}

// NewCloudProvider creates a new VMware Cloud Director provider.
func NewCloudProvider(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc) (*Provider, error) {
	if dc.Spec.VMwareCloudDirector == nil {
		return nil, errors.New("datacenter is not a VMware Cloud Director datacenter")
	}

	return &Provider{
		secretKeySelector: secretKeyGetter,
		dc:                dc.Spec.VMwareCloudDirector,
	}, nil
}

var _ provider.CloudProvider = &Provider{}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (creds *resources.VMwareCloudDirectorCredentials, err error) {
	username := cloud.VMwareCloudDirector.Username
	password := cloud.VMwareCloudDirector.Password
	apiToken := cloud.VMwareCloudDirector.APIToken
	organization := cloud.VMwareCloudDirector.Organization
	vdc := cloud.VMwareCloudDirector.VDC

	if organization == "" {
		if cloud.VMwareCloudDirector.CredentialsReference == nil {
			return nil, errors.New("no credentials provided")
		}
		organization, err = secretKeySelector(cloud.VMwareCloudDirector.CredentialsReference, resources.VMwareCloudDirectorOrganization)
		if err != nil {
			return nil, err
		}
	}

	if vdc == "" {
		if cloud.VMwareCloudDirector.CredentialsReference == nil {
			return nil, errors.New("no credentials provided")
		}
		vdc, err = secretKeySelector(cloud.VMwareCloudDirector.CredentialsReference, resources.VMwareCloudDirectorVDC)
		if err != nil {
			return nil, err
		}
	}

	// Check if API Token exists.
	if apiToken == "" && cloud.VMwareCloudDirector.CredentialsReference != nil {
		apiToken, _ = secretKeySelector(cloud.VMwareCloudDirector.CredentialsReference, resources.VMwareCloudDirectorAPIToken)
	}
	if apiToken != "" {
		return &resources.VMwareCloudDirectorCredentials{
			Organization: organization,
			APIToken:     apiToken,
			VDC:          vdc,
		}, nil
	}

	// Check for Username/password since API token doesn't exist.
	if username == "" {
		if cloud.VMwareCloudDirector.CredentialsReference == nil {
			return nil, errors.New("no credentials provided")
		}
		username, err = secretKeySelector(cloud.VMwareCloudDirector.CredentialsReference, resources.VMwareCloudDirectorUsername)
		if err != nil {
			return nil, err
		}
	}

	if password == "" {
		if cloud.VMwareCloudDirector.CredentialsReference == nil {
			return nil, errors.New("no credentials provided")
		}
		password, err = secretKeySelector(cloud.VMwareCloudDirector.CredentialsReference, resources.VMwareCloudDirectorPassword)
		if err != nil {
			return nil, err
		}
	}

	return &resources.VMwareCloudDirectorCredentials{
		Username:     username,
		Password:     password,
		Organization: organization,
		VDC:          vdc,
	}, nil
}

func ListCatalogs(ctx context.Context, auth Auth) (apiv1.VMwareCloudDirectorCatalogList, error) {
	client, err := NewClientWithAuth(auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create VMware Cloud Director client: %w", err)
	}

	org, err := client.GetOrganization()
	if err != nil {
		return nil, fmt.Errorf("failed to get organization %s: %w", auth.Organization, err)
	}

	catalogs, err := org.QueryCatalogList()
	if err != nil {
		return nil, fmt.Errorf("failed to get list catalog for organization %s: %w", auth.Organization, err)
	}

	var catlogArr apiv1.VMwareCloudDirectorCatalogList
	for _, catalog := range catalogs {
		catlogArr = append(catlogArr, apiv1.VMwareCloudDirectorCatalog{
			Name: catalog.Name,
		})
	}
	return catlogArr, nil
}

func ListTemplates(ctx context.Context, auth Auth, catalogName string) (apiv1.VMwareCloudDirectorTemplateList, error) {
	client, err := NewClientWithAuth(auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create VMware Cloud Director client: %w", err)
	}

	org, err := client.GetOrganization()
	if err != nil {
		return nil, fmt.Errorf("failed to get organization %s: %w", auth.Organization, err)
	}

	catalog, err := org.GetCatalogByNameOrId(catalogName, true)
	if err != nil {
		return nil, fmt.Errorf("failed to get catalog '%s': %w", catalogName, err)
	}

	templates, err := catalog.QueryVappTemplateList()
	if err != nil {
		return nil, fmt.Errorf("failed to list templates for catalog '%s': %w", catalogName, err)
	}

	var templateArr apiv1.VMwareCloudDirectorTemplateList
	for _, template := range templates {
		templateArr = append(templateArr, apiv1.VMwareCloudDirectorTemplate{
			Name: template.Name,
		})
	}
	return templateArr, nil
}

func ListOVDCNetworks(ctx context.Context, auth Auth) (apiv1.VMwareCloudDirectorNetworkList, error) {
	client, err := NewClientWithAuth(auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create VMware Cloud Director client: %w", err)
	}

	org, err := client.GetOrganization()
	if err != nil {
		return nil, fmt.Errorf("failed to get organization %s: %w", auth.Organization, err)
	}

	orgVDC, err := client.GetVDCForOrg(*org)
	if err != nil {
		return nil, fmt.Errorf("failed to get organization VDC '%s': %w", auth.VDC, err)
	}

	var orgVDCNetworks apiv1.VMwareCloudDirectorNetworkList
	for _, an := range orgVDC.Vdc.AvailableNetworks {
		for _, reference := range an.Network {
			if reference.HREF != "" {
				orgVDCNetworks = append(orgVDCNetworks, apiv1.VMwareCloudDirectorNetwork{
					Name: reference.Name,
				})
			}
		}
	}

	return orgVDCNetworks, nil
}

func ListComputePolicies(ctx context.Context, auth Auth) (apiv1.VMwareCloudDirectorComputePolicyList, error) {
	client, err := NewClientWithAuth(auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create VMware Cloud Director client: %w", err)
	}

	allPolicies, err := client.VCDClient.GetAllVdcComputePoliciesV2(url.Values{})
	if err != nil {
		return nil, fmt.Errorf("failed to get VDC compute policies %s: %w", auth.Organization, err)
	}

	var policies apiv1.VMwareCloudDirectorComputePolicyList
	for _, policy := range allPolicies {
		description := ""

		if policy.VdcComputePolicyV2.Description != nil {
			description = *policy.VdcComputePolicyV2.Description
		}
		policies = append(policies, apiv1.VMwareCloudDirectorComputePolicy{
			ID:           policy.VdcComputePolicyV2.ID,
			Name:         policy.VdcComputePolicyV2.Name,
			Description:  description,
			IsSizingOnly: policy.VdcComputePolicyV2.IsSizingOnly,
		})
	}
	return policies, nil
}

func ListStorageProfiles(ctx context.Context, auth Auth) (apiv1.VMwareCloudDirectorStorageProfileList, error) {
	client, err := NewClientWithAuth(auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create VMware Cloud Director client: %w", err)
	}

	org, err := client.GetOrganization()
	if err != nil {
		return nil, fmt.Errorf("failed to get organization %s: %w", auth.Organization, err)
	}

	orgVDC, err := client.GetVDCForOrg(*org)
	if err != nil {
		return nil, fmt.Errorf("failed to get organization VDC %q: %w", auth.VDC, err)
	}

	var storageProfiles apiv1.VMwareCloudDirectorStorageProfileList
	if orgVDC.Vdc.VdcStorageProfiles == nil {
		return storageProfiles, nil
	}

	for _, reference := range orgVDC.Vdc.VdcStorageProfiles.VdcStorageProfile {
		if reference.HREF != "" {
			storageProfiles = append(storageProfiles, apiv1.VMwareCloudDirectorStorageProfile{
				Name: reference.Name,
			})
		}
	}

	return storageProfiles, nil
}
