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

package provider

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	providercommon "k8c.io/dashboard/v2/pkg/handler/common/provider"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/handler/v2/cluster"
	"k8c.io/dashboard/v2/pkg/provider"
	awsprovider "k8c.io/dashboard/v2/pkg/provider/cloud/aws"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/utils/pointer"
)

// awsSizeNoCredentialsReq represent a request for AWS machine types resources
// swagger:parameters listAWSSizesNoCredentialsV2
type awsSizeNoCredentialsReq struct {
	cluster.GetClusterReq
	// architecture query parameter. Supports: arm64 and x64 types.
	// in: query
	Architecture string `json:"architecture,omitempty"`
}

// AWSCommonReq represent a request with common parameters for AWS.
type AWSCommonReq struct {
	// in: header
	// name: AccessKeyID
	AccessKeyID string
	// in: header
	// name: SecretAccessKey
	SecretAccessKey string
	// in: header
	// name: Credential
	Credential string
	// in: header
	// name: AssumeRoleARN
	AssumeRoleARN string
	// in: header
	// name: ExternalID
	AssumeRoleExternalID string
	// in: header
	// name: VPC
	VPC string
}

// AWSProjectCommonReq represents a project request with common parameters for AWS
// swagger:parameters listProjectAWSSizes
type AWSProjectCommonReq struct {
	AWSCommonReq

	common.ProjectReq
}

// AWSProjectSizesReq represents a project request for a AWS datacenter within the context of KKP
// swagger:parameters listProjectAWSSizes
type AWSProjectSizesReq struct {
	AWSProjectCommonReq

	// in: header
	// name: Region
	Region string

	// in: header
	// DatacenterName datacenter name
	DatacenterName string

	// architecture query parameter. Supports: arm64 and x64 types.
	// in: query
	Architecture string `json:"architecture,omitempty"`
}

// AWSProjectDCReq represents a project request for AWS subnets within the context of KKP
// swagger:parameters listProjectAWSSubnets listProjectAWSVPCs listProjectAWSSecurityGroups
type AWSProjectDCReq struct {
	AWSProjectCommonReq

	// in: path
	// required: true
	DC string `json:"dc"`
}

type awsCredentials struct {
	accessKeyID          string
	secretAccessKey      string
	assumeRoleARN        string
	assumeRoleExternalID string
	vpcID                string
}

// GetSeedCluster returns the SeedCluster object.
func (req awsSizeNoCredentialsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		ClusterID: req.ClusterID,
	}
}

// Validate validates AWSCommonReq request.
func (req AWSCommonReq) Validate() error {
	if len(req.Credential) == 0 && len(req.AccessKeyID) == 0 && len(req.SecretAccessKey) == 0 {
		return fmt.Errorf("AWS credentials cannot be empty")
	}
	return nil
}

func DecodeAWSCommonReq(c context.Context, r *http.Request) (interface{}, error) {
	var req AWSCommonReq

	req.AccessKeyID = r.Header.Get("AccessKeyID")
	req.SecretAccessKey = r.Header.Get("SecretAccessKey")
	req.Credential = r.Header.Get("Credential")
	req.AssumeRoleARN = r.Header.Get("AssumeRoleARN")
	req.AssumeRoleExternalID = r.Header.Get("AssumeRoleExternalID")
	req.VPC = r.Header.Get("VPC")

	return req, nil
}

func DecodeProjectAWSCommonReq(c context.Context, r *http.Request) (interface{}, error) {
	var req AWSProjectCommonReq

	commonReq, err := DecodeAWSCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	var ok bool
	req.AWSCommonReq, ok = commonReq.(AWSCommonReq)
	if !ok {
		return nil, err
	}

	projReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq, ok = projReq.(common.ProjectReq)
	if !ok {
		return nil, err
	}

	return req, nil
}

func DecodeAWSSizeNoCredentialsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req awsSizeNoCredentialsReq

	clusterID, err := common.DecodeClusterID(c, r)
	if err != nil {
		return nil, err
	}
	req.ClusterID = clusterID

	pr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = pr.(common.ProjectReq)

	req.Architecture = r.URL.Query().Get("architecture")
	if len(req.Architecture) > 0 {
		if req.Architecture == handlercommon.ARM64Architecture || req.Architecture == handlercommon.X64Architecture {
			return req, nil
		}
		return nil, fmt.Errorf("wrong query parameter, unsupported architecture: %s", req.Architecture)
	}

	return req, nil
}

func DecodeProjectAWSSizesReq(c context.Context, r *http.Request) (interface{}, error) {
	var req AWSProjectSizesReq

	projectCommon, err := DecodeProjectAWSCommonReq(c, r)
	if err != nil {
		return nil, err
	}

	req.AWSProjectCommonReq = projectCommon.(AWSProjectCommonReq)
	req.Region = r.Header.Get("Region")
	req.DatacenterName = r.Header.Get("DatacenterName")

	req.Architecture = r.URL.Query().Get("architecture")
	if len(req.Architecture) > 0 {
		if req.Architecture == handlercommon.ARM64Architecture || req.Architecture == handlercommon.X64Architecture {
			return req, nil
		}
		return nil, fmt.Errorf("wrong query parameter, unsupported architecture: %s", req.Architecture)
	}

	return req, nil
}

func DecodeProjectAWSDCReq(c context.Context, r *http.Request) (interface{}, error) {
	var req AWSProjectDCReq

	projectReq, err := DecodeProjectAWSCommonReq(c, r)
	if err != nil {
		return nil, err
	}
	req.AWSProjectCommonReq = projectReq.(AWSProjectCommonReq)

	dc, ok := mux.Vars(r)["dc"]
	if !ok {
		return req, fmt.Errorf("'dc' parameter is required")
	}
	req.DC = dc

	return req, nil
}

// AWSSubnetNoCredentialsEndpoint handles the request to list AWS availability subnets in a given vpc, using credentials.
func AWSSubnetNoCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(cluster.GetClusterReq)
		return providercommon.AWSSubnetNoCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, req.ProjectID, req.ClusterID)
	}
}

// AWSSizeNoCredentialsEndpoint handles the request to list available AWS sizes.
func AWSSizeNoCredentialsEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, seedsGetter provider.SeedsGetter, settingsProvider provider.SettingsProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(awsSizeNoCredentialsReq)
		return providercommon.AWSSizeNoCredentialsEndpoint(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, seedsGetter, settingsProvider, req.ProjectID, req.ClusterID, req.Architecture)
	}
}

// ListProjectAWSSizes handles the request to list available AWS sizes for a project.
func ListProjectAWSSizes(userInfoGetter provider.UserInfoGetter, settingsProvider provider.SettingsProvider, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(AWSProjectSizesReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		filter := *settings.Spec.MachineDeploymentVMResourceQuota
		datacenterName := req.DatacenterName

		if datacenterName != "" {
			userInfo, err := userInfoGetter(ctx, req.GetProjectID())
			if err != nil {
				return nil, common.KubernetesErrorToHTTPError(err)
			}

			_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
			if err != nil {
				return nil, fmt.Errorf("error getting dc: %w", err)
			}
			filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
		}

		return providercommon.AWSSizes(req.Region, req.Architecture, filter)
	}
}

// ListProjectAWSSubnets handles the request to list the available AWS subnets for a project.
func ListProjectAWSSubnets(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AWSProjectDCReq)

		accessKeyID := req.AccessKeyID
		secretAccessKey := req.SecretAccessKey
		assumeRoleARN := req.AssumeRoleARN
		assumeRoleExternalID := req.AssumeRoleExternalID
		vpcID := req.VPC

		userInfo, err := userInfoGetter(ctx, req.ProjectID)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if len(req.Credential) > 0 {
			preset, err := presetProvider.GetPreset(ctx, userInfo, pointer.String(req.GetProjectID()), req.Credential)
			if err != nil {
				return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
			}
			if credential := preset.Spec.AWS; credential != nil {
				accessKeyID = credential.AccessKeyID
				secretAccessKey = credential.SecretAccessKey
				assumeRoleARN = credential.AssumeRoleARN
				assumeRoleExternalID = credential.AssumeRoleExternalID
				vpcID = credential.VPCID
			}
		}

		_, dc, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, req.DC)
		if err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		subnetList, err := providercommon.ListAWSSubnets(ctx, accessKeyID, secretAccessKey, assumeRoleARN, assumeRoleExternalID, vpcID, dc)
		if err != nil {
			return nil, err
		}
		if len(subnetList) > 0 {
			subnetList[0].IsDefaultSubnet = true
		}

		return subnetList, nil
	}
}

func ListProjectAWSVPCs(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AWSProjectDCReq)

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		credentials, err := getAWSCredentialsFromRequest(ctx, req.AWSCommonReq, userInfoGetter, presetProvider, req.GetProjectID())
		if err != nil {
			return nil, err
		}

		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, req.DC)
		if err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		return listAWSVPCS(ctx, credentials.accessKeyID, credentials.secretAccessKey, credentials.assumeRoleARN, credentials.assumeRoleExternalID, datacenter)
	}
}

func ListProjectAWSSecurityGroups(userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, presetProvider provider.PresetProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(AWSProjectDCReq)

		userInfo, err := userInfoGetter(ctx, req.GetProjectID())
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		credentials, err := getAWSCredentialsFromRequest(ctx, req.AWSCommonReq, userInfoGetter, presetProvider, req.GetProjectID())
		if err != nil {
			return nil, err
		}

		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, req.DC)
		if err != nil {
			return nil, utilerrors.NewBadRequest(err.Error())
		}

		return listSecurityGroup(ctx, credentials.accessKeyID, credentials.secretAccessKey, credentials.assumeRoleARN, credentials.assumeRoleExternalID, datacenter.Spec.AWS.Region, credentials.vpcID)
	}
}

func listSecurityGroup(ctx context.Context, accessKeyID, secretAccessKey, assumeRoleARN, assumeRoleExternalID, region, vpc string) (*apiv1.AWSSecurityGroupList, error) {
	securityGroupList := &apiv1.AWSSecurityGroupList{}

	securityGroups, err := awsprovider.GetSecurityGroups(ctx, accessKeyID, secretAccessKey, assumeRoleARN, assumeRoleExternalID, region, vpc)
	if err != nil {
		return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get Security Groups: %v", err))
	}

	for _, sg := range securityGroups {
		securityGroupList.IDs = append(securityGroupList.IDs, *sg.GroupId)
	}

	return securityGroupList, nil
}

func getAWSCredentialsFromRequest(ctx context.Context, req AWSCommonReq, userInfoGetter provider.UserInfoGetter, presetProvider provider.PresetProvider, projectID string) (*awsCredentials, error) {
	accessKeyID := req.AccessKeyID
	secretAccessKey := req.SecretAccessKey
	assumeRoleARN := req.AssumeRoleARN
	assumeRoleExternalID := req.AssumeRoleExternalID
	vpcID := req.VPC

	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	if len(req.Credential) > 0 {
		preset, err := presetProvider.GetPreset(ctx, userInfo, pointer.String(projectID), req.Credential)
		if err != nil {
			return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("can not get preset %s for user %s", req.Credential, userInfo.Email))
		}
		if credential := preset.Spec.AWS; credential != nil {
			accessKeyID = credential.AccessKeyID
			secretAccessKey = credential.SecretAccessKey
			assumeRoleARN = credential.AssumeRoleARN
			assumeRoleExternalID = credential.AssumeRoleExternalID
			vpcID = credential.VPCID
		}
	}

	return &awsCredentials{
		accessKeyID:          accessKeyID,
		secretAccessKey:      secretAccessKey,
		assumeRoleARN:        assumeRoleARN,
		assumeRoleExternalID: assumeRoleExternalID,
		vpcID:                vpcID,
	}, nil
}

func listAWSVPCS(ctx context.Context, accessKeyID, secretAccessKey string, assumeRoleARN string, assumeRoleExternalID string, datacenter *kubermaticv1.Datacenter) (apiv1.AWSVPCList, error) {
	if datacenter.Spec.AWS == nil {
		return nil, utilerrors.NewBadRequest("datacenter is not an AWS datacenter")
	}

	vpcsResults, err := awsprovider.GetVPCS(ctx, accessKeyID, secretAccessKey, assumeRoleARN, assumeRoleExternalID, datacenter.Spec.AWS.Region)
	if err != nil {
		return nil, err
	}

	vpcs := apiv1.AWSVPCList{}
	for _, vpc := range vpcsResults {
		var tags []apiv1.AWSTag
		var cidrBlockList []apiv1.AWSVpcCidrBlockAssociation
		var Ipv6CidrBlocList []apiv1.AWSVpcIpv6CidrBlockAssociation
		var name string

		for _, tag := range vpc.Tags {
			tags = append(tags, apiv1.AWSTag{Key: *tag.Key, Value: *tag.Value})
			if *tag.Key == "Name" {
				name = *tag.Value
			}
		}

		for _, cidr := range vpc.CidrBlockAssociationSet {
			cidrBlock := apiv1.AWSVpcCidrBlockAssociation{
				AssociationID: *cidr.AssociationId,
				CidrBlock:     *cidr.CidrBlock,
			}
			if cidr.CidrBlockState != nil {
				cidrBlock.State = string(cidr.CidrBlockState.State)

				if cidr.CidrBlockState.StatusMessage != nil {
					cidrBlock.StatusMessage = *cidr.CidrBlockState.StatusMessage
				}
			}
			cidrBlockList = append(cidrBlockList, cidrBlock)
		}

		for _, cidr := range vpc.Ipv6CidrBlockAssociationSet {
			cidrBlock := apiv1.AWSVpcIpv6CidrBlockAssociation{
				AWSVpcCidrBlockAssociation: apiv1.AWSVpcCidrBlockAssociation{
					AssociationID: *cidr.AssociationId,
					CidrBlock:     *cidr.Ipv6CidrBlock,
				},
			}
			if cidr.Ipv6CidrBlockState != nil {
				cidrBlock.State = string(cidr.Ipv6CidrBlockState.State)
				if cidr.Ipv6CidrBlockState.StatusMessage != nil {
					cidrBlock.StatusMessage = *cidr.Ipv6CidrBlockState.StatusMessage
				}
			}

			Ipv6CidrBlocList = append(Ipv6CidrBlocList, cidrBlock)
		}

		vpcs = append(vpcs, apiv1.AWSVPC{
			Name:                        name,
			VpcID:                       *vpc.VpcId,
			CidrBlock:                   *vpc.CidrBlock,
			DhcpOptionsID:               *vpc.DhcpOptionsId,
			InstanceTenancy:             string(vpc.InstanceTenancy),
			IsDefault:                   *vpc.IsDefault,
			OwnerID:                     *vpc.OwnerId,
			State:                       string(vpc.State),
			Tags:                        tags,
			Ipv6CidrBlockAssociationSet: Ipv6CidrBlocList,
			CidrBlockAssociationSet:     cidrBlockList,
		})
	}

	return vpcs, err
}
