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
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"net/http"

	"github.com/gophercloud/gophercloud"
	goopenstack "github.com/gophercloud/gophercloud/openstack"
	osavailabilityzones "github.com/gophercloud/gophercloud/openstack/compute/v2/extensions/availabilityzones"
	ossservergroups "github.com/gophercloud/gophercloud/openstack/compute/v2/extensions/servergroups"
	osflavors "github.com/gophercloud/gophercloud/openstack/compute/v2/flavors"
	osprojects "github.com/gophercloud/gophercloud/openstack/identity/v3/projects"
	ossecuritygroups "github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/security/groups"
	osecuritygrouprules "github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/security/rules"
	ossubnetpools "github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/subnetpools"
	osnetworks "github.com/gophercloud/gophercloud/openstack/networking/v2/networks"
	ossubnets "github.com/gophercloud/gophercloud/openstack/networking/v2/subnets"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	kubermaticlog "k8c.io/kubermatic/v2/pkg/log"
	"k8c.io/kubermatic/v2/pkg/resources"
	providerconfig "k8c.io/machine-controller/pkg/providerconfig/types"
)

const (
	// SecurityGroupCleanupFinalizer will instruct the deletion of the security group.
	SecurityGroupCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-security-group"
	// NetworkCleanupFinalizer will instruct the deletion of the network.
	NetworkCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-network-v2"
	// SubnetCleanupFinalizer will instruct the deletion of the IPv4 subnet.
	SubnetCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-subnet-v2"
	// IPv6SubnetCleanupFinalizer will instruct the deletion of the IPv6 subnet.
	IPv6SubnetCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-subnet-ipv6"
	// RouterCleanupFinalizer will instruct the deletion of the router.
	RouterCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-router-v2"
	// RouterSubnetLinkCleanupFinalizer will instruct the deletion of the link between the router and the IPv4 subnet.
	RouterSubnetLinkCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-router-subnet-link-v2"
	// RouterIPv6SubnetLinkCleanupFinalizer will instruct the deletion of the link between the router and the IPv6 subnet.
	RouterIPv6SubnetLinkCleanupFinalizer = "kubermatic.k8c.io/cleanup-openstack-router-subnet-link-ipv6"
)

type getClientFunc func(ctx context.Context, cluster kubermaticv1.CloudSpec, dc *kubermaticv1.DatacenterSpecOpenstack, secretKeySelector provider.SecretKeySelectorValueFunc, caBundle *x509.CertPool) (*gophercloud.ServiceClient, error)

// Provider is a struct that implements CloudProvider interface.
type Provider struct {
	dc                *kubermaticv1.DatacenterSpecOpenstack
	secretKeySelector provider.SecretKeySelectorValueFunc
	caBundle          *x509.CertPool
	getClientFunc     getClientFunc
}

// NewCloudProvider creates a new openstack provider.
func NewCloudProvider(
	dc *kubermaticv1.Datacenter,
	secretKeyGetter provider.SecretKeySelectorValueFunc,
	caBundle *x509.CertPool,
) (*Provider, error) {
	if dc.Spec.Openstack == nil {
		return nil, errors.New("datacenter is not an Openstack datacenter")
	}
	return &Provider{
		dc:                dc.Spec.Openstack,
		secretKeySelector: secretKeyGetter,
		caBundle:          caBundle,
		getClientFunc:     getNetClientForCluster,
	}, nil
}

var _ provider.CloudProvider = &Provider{}

// GetFlavors lists available flavors for the given CloudSpec.DatacenterName and OpenstackSpec.Region.
func GetFlavors(authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]osflavors.Flavor, error) {
	authClient, err := getAuthClient(authURL, credentials, caBundle)
	if err != nil {
		return nil, err
	}
	flavors, err := getFlavors(authClient, region)
	if err != nil {
		return nil, err
	}

	return flavors, nil
}

// GetTenants lists all available tenents for the given CloudSpec.DatacenterName.
func GetTenants(authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]osprojects.Project, error) {
	authClient, err := getAuthClient(authURL, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	tenants, err := getTenants(authClient, region)
	if err != nil {
		return nil, fmt.Errorf("couldn't get tenants for region %s: %w", region, err)
	}

	return tenants, nil
}

// GetNetworks lists all available networks for the given CloudSpec.DatacenterName.
func GetNetworks(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]NetworkWithExternalExt, error) {
	authClient, err := getNetClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	networks, err := getAllNetworks(authClient, osnetworks.ListOpts{})
	if err != nil {
		return nil, fmt.Errorf("couldn't get networks: %w", err)
	}

	return networks, nil
}

// GetSecurityGroups lists all available security groups for the given CloudSpec.DatacenterName.
func GetSecurityGroups(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]ossecuritygroups.SecGroup, error) {
	netClient, err := getNetClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	page, err := ossecuritygroups.List(netClient, ossecuritygroups.ListOpts{TenantID: credentials.ProjectID}).AllPages()
	if err != nil {
		return nil, fmt.Errorf("failed to list security groups: %w", err)
	}
	secGroups, err := ossecuritygroups.ExtractGroups(page)
	if err != nil {
		return nil, fmt.Errorf("failed to extract security groups: %w", err)
	}
	return secGroups, nil
}

// GetSeverGroups lists all available server groups for the given CloudSpec.DatacenterName.
func GetSeverGroups(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]ossservergroups.ServerGroup, error) {
	netClient, err := getComputeClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	page, err := ossservergroups.List(netClient, ossservergroups.ListOpts{}).AllPages()
	if err != nil {
		return nil, fmt.Errorf("failed to list server groups: %w", err)
	}
	groups, err := ossservergroups.ExtractServerGroups(page)
	if err != nil {
		return nil, fmt.Errorf("failed to extract server groups: %w", err)
	}
	return groups, nil
}

// GetAvailabilityZones lists availability zones for the given CloudSpec.DatacenterName and OpenstackSpec.Region.
func GetAvailabilityZones(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]osavailabilityzones.AvailabilityZone, error) {
	computeClient, err := getComputeClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, err
	}
	availabilityZones, err := getAvailabilityZones(computeClient)
	if err != nil {
		return nil, err
	}

	return availabilityZones, nil
}

// GetSubnetPools lists all available subnet pools.
func GetSubnetPools(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, ipVersion int, caBundle *x509.CertPool) ([]ossubnetpools.SubnetPool, error) {
	authClient, err := getNetClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	subnetPools, err := getAllSubnetPools(authClient, ossubnetpools.ListOpts{IPVersion: ipVersion, TenantID: credentials.ProjectID})
	if err != nil {
		return nil, fmt.Errorf("couldn't get subnet pools: %w", err)
	}

	return subnetPools, nil
}

func getAuthClient(authURL string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) (*gophercloud.ProviderClient, error) {
	opts := gophercloud.AuthOptions{
		IdentityEndpoint:            authURL,
		Username:                    credentials.Username,
		Password:                    credentials.Password,
		DomainName:                  credentials.Domain,
		TenantName:                  credentials.Project,
		TenantID:                    credentials.ProjectID,
		ApplicationCredentialID:     credentials.ApplicationCredentialID,
		ApplicationCredentialSecret: credentials.ApplicationCredentialSecret,
		TokenID:                     credentials.Token,
	}

	client, err := goopenstack.NewClient(authURL)
	if err != nil {
		return nil, err
	}

	if client != nil {
		// overwrite the default host/root CA Bundle with the proper CA Bundle
		client.HTTPClient.Transport = &http.Transport{TLSClientConfig: &tls.Config{RootCAs: caBundle}}
	}

	err = goopenstack.Authenticate(client, opts)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func getNetClient(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) (*gophercloud.ServiceClient, error) {
	authClient, err := getAuthClient(authURL, credentials, caBundle)
	if err != nil {
		return nil, err
	}

	// Set ProjectID when project's name is provided for later use in ListOpts.
	if credentials.ProjectID == "" && credentials.Project != "" {
		project, err := getProjectByName(authClient, credentials.Project, region)
		if err != nil {
			return nil, err
		}
		credentials.ProjectID = project.ID
	}

	serviceClient, err := goopenstack.NewNetworkV2(authClient, gophercloud.EndpointOpts{Region: region})
	if err != nil {
		// this is special case for services that span only one region.
		if isEndpointNotFoundErr(err) {
			serviceClient, err = goopenstack.NewNetworkV2(authClient, gophercloud.EndpointOpts{})
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	serviceClient.Context = ctx

	return serviceClient, err
}

func getComputeClient(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) (*gophercloud.ServiceClient, error) {
	authClient, err := getAuthClient(authURL, credentials, caBundle)
	if err != nil {
		return nil, err
	}

	serviceClient, err := goopenstack.NewComputeV2(authClient, gophercloud.EndpointOpts{Region: region})
	if err != nil {
		// this is special case for services that span only one region.
		if isEndpointNotFoundErr(err) {
			serviceClient, err = goopenstack.NewComputeV2(authClient, gophercloud.EndpointOpts{})
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	serviceClient.Context = ctx
	return serviceClient, err
}

// GetSubnets list all available subnet ids for a given CloudSpec.
func GetSubnets(ctx context.Context, authURL, region, networkID string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) ([]ossubnets.Subnet, error) {
	serviceClient, err := getNetClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return nil, fmt.Errorf("couldn't get auth client: %w", err)
	}

	subnets, err := getSubnetForNetwork(serviceClient, networkID)
	if err != nil {
		return nil, err
	}

	return subnets, nil
}

func (os *Provider) AddICMPRulesIfRequired(ctx context.Context, cluster *kubermaticv1.Cluster) error {
	if cluster.Spec.Cloud.Openstack.SecurityGroups == "" {
		return nil
	}
	sgName := cluster.Spec.Cloud.Openstack.SecurityGroups

	creds, err := GetCredentialsForCluster(cluster.Spec.Cloud, os.secretKeySelector)
	if err != nil {
		return err
	}

	netClient, err := getNetClient(ctx, os.dc.AuthURL, os.dc.Region, creds, os.caBundle)
	if err != nil {
		return fmt.Errorf("failed to create a authenticated openstack client: %w", err)
	}

	// We can only get security groups by ID and can't be sure that what's on the cluster
	securityGroups, err := getSecurityGroups(netClient, ossecuritygroups.ListOpts{Name: sgName})
	if err != nil {
		return fmt.Errorf("failed to list security groups: %w", err)
	}

	for _, sg := range securityGroups {
		if err := addICMPRulesToSecurityGroupIfNecessary(cluster, sg, netClient); err != nil {
			return fmt.Errorf("failed to add rules for ICMP to security group %q: %w", sg.ID, err)
		}
	}
	return nil
}

func addICMPRulesToSecurityGroupIfNecessary(cluster *kubermaticv1.Cluster, secGroup ossecuritygroups.SecGroup, netClient *gophercloud.ServiceClient) error {
	var hasIPV4Rule, hasIPV6Rule bool
	for _, rule := range secGroup.Rules {
		if rule.Direction == string(osecuritygrouprules.DirIngress) {
			if rule.EtherType == string(osecuritygrouprules.EtherType4) && rule.Protocol == string(osecuritygrouprules.ProtocolICMP) {
				hasIPV4Rule = true
			}
			if rule.EtherType == string(osecuritygrouprules.EtherType6) && rule.Protocol == string(osecuritygrouprules.ProtocolIPv6ICMP) {
				hasIPV6Rule = true
			}
		}
	}

	var rulesToCreate []osecuritygrouprules.CreateOpts
	if !hasIPV4Rule {
		rulesToCreate = append(rulesToCreate, osecuritygrouprules.CreateOpts{
			Direction:  osecuritygrouprules.DirIngress,
			EtherType:  osecuritygrouprules.EtherType4,
			SecGroupID: secGroup.ID,
			Protocol:   osecuritygrouprules.ProtocolICMP,
		})
		kubermaticlog.Logger.Infow("Adding Openstack ICMP allow rule to cluster", "cluster", cluster.Name)
	}
	if !hasIPV6Rule {
		rulesToCreate = append(rulesToCreate, osecuritygrouprules.CreateOpts{
			Direction:  osecuritygrouprules.DirIngress,
			EtherType:  osecuritygrouprules.EtherType6,
			SecGroupID: secGroup.ID,
			Protocol:   osecuritygrouprules.ProtocolIPv6ICMP,
		})
		kubermaticlog.Logger.Infow("Adding Openstack ICMP6 allow rule to cluster", "cluster", cluster.Name)
	}

	for _, rule := range rulesToCreate {
		res := osecuritygrouprules.Create(netClient, rule)
		if res.Err != nil {
			return fmt.Errorf("failed to create security group rule: %w", res.Err)
		}
		if _, err := res.Extract(); err != nil {
			return fmt.Errorf("failed to extract result after security group creation: %w", err)
		}
	}

	return nil
}

func getNetClientForCluster(ctx context.Context, cluster kubermaticv1.CloudSpec, dc *kubermaticv1.DatacenterSpecOpenstack, secretKeySelector provider.SecretKeySelectorValueFunc, caBundle *x509.CertPool) (*gophercloud.ServiceClient, error) {
	creds, err := GetCredentialsForCluster(cluster, secretKeySelector)
	if err != nil {
		return nil, fmt.Errorf("failed to get credentials: %w", err)
	}

	netClient, err := getNetClient(ctx, dc.AuthURL, dc.Region, creds, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create a authenticated openstack client: %w", err)
	}
	return netClient, nil
}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error
// The user can choose three ways for authentication. The first is a token. Second through Application Credentials.
// The last one uses a username and password. Those methods work exclusively.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (*resources.OpenstackCredentials, error) {
	username := cloud.Openstack.Username
	password := cloud.Openstack.Password
	project := cloud.Openstack.Project
	projectID := cloud.Openstack.ProjectID
	domain := cloud.Openstack.Domain
	applicationCredentialID := cloud.Openstack.ApplicationCredentialID
	applicationCredentialSecret := cloud.Openstack.ApplicationCredentialSecret
	useToken := cloud.Openstack.UseToken
	token := cloud.Openstack.Token
	var err error

	if applicationCredentialID != "" && applicationCredentialSecret != "" {
		return &resources.OpenstackCredentials{
			ApplicationCredentialSecret: applicationCredentialSecret,
			ApplicationCredentialID:     applicationCredentialID,
		}, nil
	}

	if applicationCredentialID == "" && cloud.Openstack.CredentialsReference != nil {
		applicationCredentialID, _ = secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackApplicationCredentialID)
		if applicationCredentialID != "" {
			applicationCredentialSecret, err = secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackApplicationCredentialSecret)
			if err != nil {
				return &resources.OpenstackCredentials{}, err
			}

			return &resources.OpenstackCredentials{
				ApplicationCredentialSecret: applicationCredentialSecret,
				ApplicationCredentialID:     applicationCredentialID,
			}, nil
		}
	}

	if domain == "" {
		if cloud.Openstack.CredentialsReference == nil {
			return &resources.OpenstackCredentials{}, errors.New("no credentials provided")
		}
		domain, err = secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackDomain)
		if err != nil {
			return &resources.OpenstackCredentials{}, err
		}
	}

	if useToken && token != "" {
		return &resources.OpenstackCredentials{
			Token:  token,
			Domain: domain,
		}, nil
	}

	if !useToken && cloud.Openstack.CredentialsReference != nil {
		token, _ := secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackToken)
		if token != "" {
			return &resources.OpenstackCredentials{
				Token:  token,
				Domain: domain,
			}, nil
		}
	}

	if username == "" {
		if cloud.Openstack.CredentialsReference == nil {
			return &resources.OpenstackCredentials{}, errors.New("no credentials provided")
		}
		username, err = secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackUsername)
		if err != nil {
			return &resources.OpenstackCredentials{}, err
		}
	}

	if password == "" {
		if cloud.Openstack.CredentialsReference == nil {
			return &resources.OpenstackCredentials{}, errors.New("no credentials provided")
		}
		password, err = secretKeySelector(cloud.Openstack.CredentialsReference, resources.OpenstackPassword)
		if err != nil {
			return &resources.OpenstackCredentials{}, err
		}
	}

	if project == "" && cloud.Openstack.CredentialsReference != nil && cloud.Openstack.CredentialsReference.Name != "" {
		if project, err = firstKey(secretKeySelector, cloud.Openstack.CredentialsReference, resources.OpenstackProject, resources.OpenstackTenant); err != nil {
			return &resources.OpenstackCredentials{}, err
		}
	}

	if projectID == "" && cloud.Openstack.CredentialsReference != nil && cloud.Openstack.CredentialsReference.Name != "" {
		if projectID, err = firstKey(secretKeySelector, cloud.Openstack.CredentialsReference, resources.OpenstackProjectID, resources.OpenstackTenantID); err != nil {
			return &resources.OpenstackCredentials{}, err
		}
	}

	return &resources.OpenstackCredentials{
		Username:                    username,
		Password:                    password,
		Project:                     project,
		ProjectID:                   projectID,
		Domain:                      domain,
		ApplicationCredentialID:     applicationCredentialID,
		ApplicationCredentialSecret: applicationCredentialSecret,
	}, nil
}

// firstKey read the secret and return value for the firstkey. if the firstKey does not exist, tries with
// fallbackKey. if the fallbackKey does not exist then return an error.
func firstKey(secretKeySelector provider.SecretKeySelectorValueFunc, configVar *providerconfig.GlobalSecretKeySelector, firstKey string, fallbackKey string) (string, error) {
	var value string
	var err error
	if value, err = secretKeySelector(configVar, firstKey); err != nil {
		// fallback
		if value, err = secretKeySelector(configVar, fallbackKey); err != nil {
			return "", err
		}
	}
	return value, nil
}

func ValidateCredentials(ctx context.Context, authURL, region string, credentials *resources.OpenstackCredentials, caBundle *x509.CertPool) error {
	computeClient, err := getComputeClient(ctx, authURL, region, credentials, caBundle)
	if err != nil {
		return err
	}
	_, err = getAvailabilityZones(computeClient)

	return err
}
