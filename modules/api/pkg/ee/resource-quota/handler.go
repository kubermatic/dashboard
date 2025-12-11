//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2022 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package resourcequota

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	kubermaticprovider "k8c.io/kubermatic/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/util/sets"
)

const (
	DefaultProjectResourceQuotaLabel = "kkp-default-resource-quota"
	totalQuotaName                   = "totalquota"
)

// swagger:parameters getResourceQuota deleteResourceQuota
type getResourceQuota struct {
	// in: path
	// required: true
	Name string `json:"quota_name"`
}

// swagger:parameters calculateProjectResourceQuotaUpdate
type calculateProjectResourceQuotaUpdate struct {
	common.GetProjectRq
	// in: body
	Body struct {
		Replicas          int                `json:"replicas"`
		ReplacedResources *ReplacedResources `json:"replacedResources,omitempty"`
		ProviderNodeTemplate
	}
}

// ReplacedResources is used to subtract replaced resources in the calculation. For instance, when user is changing instance type of an existing Machine Deployment, resources of an old instance type need to be subtracted.
type ReplacedResources struct {
	Replicas int `json:"replicas"`
	ProviderNodeTemplate
}

type ProviderNodeTemplate struct {
	// DiskSizeGB will be processed only for those providers which don't have the disk size in their API objects, like AWS, Alibabla and GCP.
	DiskSizeGB          int                                `json:"diskSizeGB,omitempty"`
	AlibabaInstanceType *apiv1.AlibabaInstanceType         `json:"alibabaInstanceType,omitempty"`
	AnexiaNodeSpec      *apiv1.AnexiaNodeSpec              `json:"anexiaNodeSpec,omitempty"`
	AWSSize             *apiv1.AWSSize                     `json:"awsSize,omitempty"`
	AzureSize           *apiv1.AzureSize                   `json:"azureSize,omitempty"`
	DOSize              *apiv1.DigitaloceanSize            `json:"doSize,omitempty"`
	GCPSize             *apiv1.GCPMachineSize              `json:"gcpSize,omitempty"`
	HetznerSize         *apiv1.HetznerSize                 `json:"hetznerSize,omitempty"`
	KubevirtNodeSize    *apiv1.KubevirtNodeSize            `json:"kubevirtNodeSize,omitempty"`
	NutanixNodeSpec     *apiv1.NutanixNodeSpec             `json:"nutanixNodeSpec,omitempty"`
	OpenstackSize       *apiv1.OpenstackSize               `json:"openstackSize,omitempty"`
	VMDirectorNodeSpec  *apiv1.VMwareCloudDirectorNodeSpec `json:"vmDirectorNodeSpec,omitempty"`
	VSphereNodeSpec     *apiv1.VSphereNodeSpec             `json:"vSphereNodeSpec,omitempty"`
}

// swagger:parameters listResourceQuotas
type listResourceQuotas struct {
	// in: query
	// required: false
	SubjectName string `json:"subject_name,omitempty"`

	// in: query
	// required: false
	SubjectKind string `json:"subject_kind,omitempty"`

	// in: query
	// required: false
	Accumulate bool `json:"accumulate,omitempty"`
}

// swagger:parameters createResourceQuota
type createResourceQuota struct {
	// in: body
	// required: true
	Body struct {
		SubjectName string      `json:"subjectName"`
		SubjectKind string      `json:"subjectKind"`
		Quota       apiv2.Quota `json:"quota"`
	}
}

// swagger:parameters putResourceQuota
type putResourceQuota struct {
	// in: path
	// required: true
	Name string `json:"quota_name"`

	// in: body
	// required: true
	Body apiv2.Quota
}

func (m createResourceQuota) Validate() error {
	if m.Body.SubjectName == "" {
		return utilerrors.NewBadRequest("subject's name cannot be empty")
	}

	if m.Body.SubjectKind == "" {
		return utilerrors.NewBadRequest("subject's kind cannot be empty")
	}

	return nil
}

func DecodeResourceQuotaReq(r *http.Request) (interface{}, error) {
	var req getResourceQuota

	req.Name = mux.Vars(r)["quota_name"]

	if req.Name == "" {
		return nil, utilerrors.NewBadRequest("`quota_name` cannot be empty")
	}

	return req, nil
}

func DecodeListResourceQuotaReq(r *http.Request) (interface{}, error) {
	var req listResourceQuotas
	var accumulate bool
	var err error

	req.SubjectName = r.URL.Query().Get("subjectName")
	req.SubjectKind = r.URL.Query().Get("subjectKind")

	queryParam := r.URL.Query().Get("accumulate")
	if queryParam != "" {
		accumulate, err = strconv.ParseBool(queryParam)
		if err != nil {
			return nil, fmt.Errorf("wrong query parameter `accumulate`: %w", err)
		}
	}
	req.Accumulate = accumulate

	return req, nil
}

func DecodeCreateResourceQuotaReq(r *http.Request) (interface{}, error) {
	var req createResourceQuota

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}

	return req, nil
}

func DecodePutResourceQuotaReq(r *http.Request) (interface{}, error) {
	var req putResourceQuota

	req.Name = mux.Vars(r)["quota_name"]
	if req.Name == "" {
		return nil, utilerrors.NewBadRequest("`quota_name` cannot be empty")
	}

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

func DecodeCalculateProjectResourceQuotaUpdateReq(c context.Context, r *http.Request) (interface{}, error) {
	var req calculateProjectResourceQuotaUpdate

	pReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = pReq.(common.ProjectReq)

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}

	return req, nil
}

func GetResourceQuota(ctx context.Context, request interface{}, provider provider.ResourceQuotaProvider, projectProvider provider.PrivilegedProjectProvider) (*apiv2.ResourceQuota, error) {
	req, ok := request.(getResourceQuota)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	resourceQuota, err := provider.GetUnsecured(ctx, req.Name)
	if err != nil {
		if apierrors.IsNotFound(err) {
			return nil, utilerrors.NewNotFound("ResourceQuota", req.Name)
		}
		return nil, err
	}

	var humanReadableName string
	if resourceQuota.Spec.Subject.Kind == kubermaticv1.ProjectSubjectKind {
		project, err := projectProvider.GetUnsecured(ctx, resourceQuota.Spec.Subject.Name, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		humanReadableName = project.Spec.Name
	}

	return convertToAPIStruct(resourceQuota, humanReadableName), nil
}

func GetResourceQuotaForProject(ctx context.Context, request interface{}, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter,
	quotaProvider provider.ResourceQuotaProvider) (*apiv2.ResourceQuota, error) {
	projectResourceQuota, projectName, err := getProjectResourceQuota(ctx, request, projectProvider, privilegedProjectProvider, userInfoGetter, quotaProvider)
	if err != nil {
		return nil, err
	}

	if projectResourceQuota == nil {
		// ResourceQuota not found. Return an empty response.
		return nil, nil
	}

	return convertToAPIStruct(projectResourceQuota, projectName), nil
}

func accumulateQuotas(rqList *kubermaticv1.ResourceQuotaList) *apiv2.ResourceQuota {
	rdAvailable := kubermaticv1.NewResourceDetails(resource.Quantity{}, resource.Quantity{}, resource.Quantity{})
	rdUsed := kubermaticv1.NewResourceDetails(resource.Quantity{}, resource.Quantity{}, resource.Quantity{})

	for _, quota := range rqList.Items {
		if quota.Spec.Quota.CPU != nil {
			rdAvailable.CPU.Add(*quota.Spec.Quota.CPU)
		}
		if quota.Spec.Quota.Memory != nil {
			rdAvailable.Memory.Add(*quota.Spec.Quota.Memory)
		}
		if quota.Spec.Quota.Storage != nil {
			rdAvailable.Storage.Add(*quota.Spec.Quota.Storage)
		}

		if quota.Status.GlobalUsage.CPU != nil {
			rdUsed.CPU.Add(*quota.Status.GlobalUsage.CPU)
		}
		if quota.Status.GlobalUsage.Memory != nil {
			rdUsed.Memory.Add(*quota.Status.GlobalUsage.Memory)
		}
		if quota.Status.GlobalUsage.Storage != nil {
			rdUsed.Storage.Add(*quota.Status.GlobalUsage.Storage)
		}
	}

	return &apiv2.ResourceQuota{
		Name:  totalQuotaName,
		Quota: apiv2.ConvertToAPIQuota(*rdAvailable),
		Status: apiv2.ResourceQuotaStatus{
			GlobalUsage: apiv2.ConvertToAPIQuota(*rdUsed),
		},
		SubjectHumanReadableName: totalQuotaName,
	}
}

func CalculateResourceQuotaUpdateForProject(
	ctx context.Context,
	request interface{},
	projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider,
	userInfoGetter provider.UserInfoGetter,
	quotaProvider provider.ResourceQuotaProvider,
) (*apiv2.ResourceQuotaUpdateCalculation, error) {
	req, ok := request.(calculateProjectResourceQuotaUpdate)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	projectResourceQuota, projectName, err := getProjectResourceQuota(ctx, req.GetProjectRq, projectProvider, privilegedProjectProvider, userInfoGetter, quotaProvider)
	if err != nil {
		return nil, err
	}
	if projectResourceQuota == nil {
		// ResourceQuota not found. Return an empty response.
		return nil, nil
	}
	globalQuotaUsage := projectResourceQuota.Status.GlobalUsage
	projectQuotaLimits := projectResourceQuota.Spec.Quota
	newResourceCalculation, err := MapProviderNodeTmplToResourceDetails(req.Body.ProviderNodeTemplate, req.Body.Replicas)
	if err != nil {
		return nil, utilerrors.NewBadRequest("invalid request, failed getting resources from request body: %v", err)
	}

	// Add the current global usage.
	if globalQuotaUsage.CPU != nil && newResourceCalculation.CPU != nil {
		newResourceCalculation.CPU.Add(*globalQuotaUsage.CPU)
	}
	if globalQuotaUsage.Memory != nil && newResourceCalculation.Memory != nil {
		newResourceCalculation.Memory.Add(*globalQuotaUsage.Memory)
	}
	if globalQuotaUsage.Storage != nil && newResourceCalculation.Storage != nil {
		newResourceCalculation.Storage.Add(*globalQuotaUsage.Storage)
	}

	// Subtract resources that are about to be replaced.
	replacedResources := req.Body.ReplacedResources
	if replacedResources != nil {
		replacedResourceCalculation, err := MapProviderNodeTmplToResourceDetails(replacedResources.ProviderNodeTemplate, replacedResources.Replicas)
		if err != nil {
			return nil, utilerrors.NewBadRequest("invalid request, failed getting resources from request body: %v", err)
		}

		if replacedResourceCalculation.CPU != nil && newResourceCalculation.CPU != nil {
			newResourceCalculation.CPU.Sub(*replacedResourceCalculation.CPU)
		}
		if replacedResourceCalculation.Memory != nil && newResourceCalculation.Memory != nil {
			newResourceCalculation.Memory.Sub(*replacedResourceCalculation.Memory)
		}
		if replacedResourceCalculation.Storage != nil && newResourceCalculation.Storage != nil {
			newResourceCalculation.Storage.Sub(*replacedResourceCalculation.Storage)
		}
	}

	// Check if quota has been exceeded.
	var msg string
	if projectQuotaLimits.CPU != nil && newResourceCalculation.CPU != nil &&
		newResourceCalculation.CPU.Cmp(*projectQuotaLimits.CPU) > 0 {
		msg += fmt.Sprintf("Calculated cpu (%s) exceeds resource quota (%s)\n", newResourceCalculation.CPU, projectQuotaLimits.CPU)
	}
	if projectQuotaLimits.Memory != nil && newResourceCalculation.Memory != nil &&
		newResourceCalculation.Memory.Cmp(*projectQuotaLimits.Memory) > 0 {
		msg += fmt.Sprintf("Calculated memory (%s) exceeds resource quota (%s)\n", newResourceCalculation.Memory, projectQuotaLimits.Memory)
	}
	if projectQuotaLimits.Storage != nil && newResourceCalculation.Storage != nil &&
		newResourceCalculation.Storage.Cmp(*projectQuotaLimits.Storage) > 0 {
		msg += fmt.Sprintf("Calculated disk size (%s) exceeds resource quota (%s)", newResourceCalculation.Storage, projectQuotaLimits.Storage)
	}

	return &apiv2.ResourceQuotaUpdateCalculation{
		ResourceQuota:   *convertToAPIStruct(projectResourceQuota, projectName),
		CalculatedQuota: apiv2.ConvertToAPIQuota(*newResourceCalculation),
		Message:         msg,
	}, nil
}

func MapProviderNodeTmplToResourceDetails(provider ProviderNodeTemplate, replicas int) (*kubermaticv1.ResourceDetails, error) {
	nc := kubermaticprovider.NewNodeCapacity()
	nc.CPUCores = &resource.Quantity{}
	nc.Memory = &resource.Quantity{}
	nc.Storage = &resource.Quantity{}

	var err error

	switch {
	case provider.AlibabaInstanceType != nil:
		if err = getAlibabaResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.AnexiaNodeSpec != nil:
		if err = getAnexiaResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.AWSSize != nil:
		if err = getAWSResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.AzureSize != nil:
		if err = getAzureResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.DOSize != nil:
		if err = getDOResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.GCPSize != nil:
		if err = getGCPResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.HetznerSize != nil:
		if err = getHetznerResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.KubevirtNodeSize != nil:
		if err = getKubevirtResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.NutanixNodeSpec != nil:
		if err = getNutanixResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.OpenstackSize != nil:
		if err = getOpenstackResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.VSphereNodeSpec != nil:
		if err = getVSphereResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	case provider.VMDirectorNodeSpec != nil:
		if err = getVMCloudDirectorResourceDetails(provider, nc); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("provider set in request not supported: %v", provider)
	}

	// Multiply by replicas count
	var cpu, mem, sto resource.Quantity
	for i := 0; i < replicas; i++ {
		cpu.Add(*nc.CPUCores)
		mem.Add(*nc.Memory)
		sto.Add(*nc.Storage)
	}

	rd := kubermaticv1.NewResourceDetails(cpu, mem, sto)

	return rd, nil
}

func getAlibabaResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.AlibabaInstanceType.CPUCoreCount)

	if err := nc.WithMemory(int(provider.AlibabaInstanceType.MemorySize), "Gi"); err != nil {
		return err
	}
	if err := nc.WithStorage(provider.DiskSizeGB, "Gi"); err != nil {
		return err
	}
	return nil
}

func getAnexiaResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.AnexiaNodeSpec.CPUs)

	if err := nc.WithMemory(int(provider.AnexiaNodeSpec.Memory), "Mi"); err != nil {
		return err
	}

	var diskSize int64
	if provider.AnexiaNodeSpec.DiskSize != nil {
		diskSize = *provider.AnexiaNodeSpec.DiskSize
	} else {
		for _, disk := range provider.AnexiaNodeSpec.Disks {
			diskSize += disk.Size
		}
	}

	if err := nc.WithStorage(int(diskSize), "Gi"); err != nil {
		return err
	}
	return nil
}

func getAWSResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.AWSSize.VCPUs)

	if err := nc.WithMemory(int(provider.AWSSize.Memory), "Gi"); err != nil {
		return err
	}
	if err := nc.WithStorage(provider.DiskSizeGB, "Gi"); err != nil {
		return err
	}
	return nil
}

func getAzureResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(int(provider.AzureSize.NumberOfCores))

	if err := nc.WithMemory(int(provider.AzureSize.MemoryInMB), "Mi"); err != nil {
		return err
	}

	if err := nc.WithStorage(int(provider.AzureSize.ResourceDiskSizeInMB+provider.AzureSize.OsDiskSizeInMB), "Mi"); err != nil {
		return err
	}
	return nil
}

func getDOResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.DOSize.VCPUs)

	if err := nc.WithMemory(provider.DOSize.Memory, "Mi"); err != nil {
		return err
	}
	if err := nc.WithStorage(provider.DOSize.Disk, "Gi"); err != nil {
		return err
	}
	return nil
}

func getGCPResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(int(provider.GCPSize.VCPUs))

	if err := nc.WithMemory(int(provider.GCPSize.Memory), "Mi"); err != nil {
		return err
	}
	if err := nc.WithStorage(provider.DiskSizeGB, "Gi"); err != nil {
		return err
	}
	return nil
}

func getHetznerResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.HetznerSize.Cores)

	if err := nc.WithMemory(int(provider.HetznerSize.Memory), "Gi"); err != nil {
		return err
	}
	if err := nc.WithStorage(provider.HetznerSize.Disk, "Gi"); err != nil {
		return err
	}
	return nil
}

func getKubevirtResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	cpus, err := strconv.Atoi(provider.KubevirtNodeSize.CPUs)
	if err != nil {
		return fmt.Errorf("error converting kubevirt node size cpus %q to int: %w", provider.KubevirtNodeSize.CPUs, err)
	}
	nc.WithCPUCount(cpus)

	memory, err := resource.ParseQuantity(provider.KubevirtNodeSize.Memory)
	if err != nil {
		return fmt.Errorf("error parsing kubevirt node memory %q to resource quantity: %w", provider.KubevirtNodeSize.Memory, err)
	}
	nc.Memory = &memory

	primaryDiskSize := provider.KubevirtNodeSize.PrimaryDiskSize
	// Default to giga if unit not provided.
	if _, err := strconv.Atoi(primaryDiskSize); err == nil {
		primaryDiskSize += "G"
	}
	storage, err := resource.ParseQuantity(primaryDiskSize)
	if err != nil {
		return fmt.Errorf("failed to parse kubevirt node storage %q to resource quantity: %w", provider.KubevirtNodeSize.PrimaryDiskSize, err)
	}

	// Add all secondary disks
	for _, d := range provider.KubevirtNodeSize.SecondaryDisks {
		secondaryDiskSize := d.Size
		// Default to giga if unit not provided.
		if _, err := strconv.Atoi(secondaryDiskSize); err == nil {
			secondaryDiskSize += "G"
		}
		secondaryStorage, err := resource.ParseQuantity(secondaryDiskSize)
		if err != nil {
			return fmt.Errorf("failed to parse kubevirt secondary node storage %q to resource quantity: %w", d.Size, err)
		}
		storage.Add(secondaryStorage)
	}
	nc.Storage = &storage

	return nil
}

func getNutanixResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(int(provider.NutanixNodeSpec.CPUs))

	if err := nc.WithMemory(int(provider.NutanixNodeSpec.MemoryMB), "Mi"); err != nil {
		return err
	}

	if provider.NutanixNodeSpec.DiskSize != nil {
		if err := nc.WithStorage(int(*provider.NutanixNodeSpec.DiskSize), "Gi"); err != nil {
			return err
		}
	} else {
		nc.Storage = &resource.Quantity{}
	}
	return nil
}

func getOpenstackResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.OpenstackSize.VCPUs)

	if err := nc.WithMemory(provider.OpenstackSize.Memory, "Mi"); err != nil {
		return err
	}

	if provider.DiskSizeGB == 0 {
		if err := nc.WithStorage(provider.OpenstackSize.Disk, "Gi"); err != nil {
			return err
		}
	} else {
		// Setting custom disk size
		if err := nc.WithStorage(provider.DiskSizeGB, "Gi"); err != nil {
			return err
		}
	}

	return nil
}

func getVSphereResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.VSphereNodeSpec.CPUs)

	if err := nc.WithMemory(provider.VSphereNodeSpec.Memory, "Mi"); err != nil {
		return err
	}

	if provider.VSphereNodeSpec.DiskSizeGB != nil {
		if err := nc.WithStorage(int(*provider.VSphereNodeSpec.DiskSizeGB), "Gi"); err != nil {
			return err
		}
	} else {
		nc.Storage = &resource.Quantity{}
	}
	return nil
}

func getVMCloudDirectorResourceDetails(provider ProviderNodeTemplate, nc *kubermaticprovider.NodeCapacity) error {
	nc.WithCPUCount(provider.VMDirectorNodeSpec.CPUCores * provider.VMDirectorNodeSpec.CPUs)

	if err := nc.WithMemory(provider.VMDirectorNodeSpec.MemoryMB, "Mi"); err != nil {
		return err
	}

	if provider.VMDirectorNodeSpec.DiskSizeGB != nil {
		if err := nc.WithStorage(int(*provider.VMDirectorNodeSpec.DiskSizeGB), "Gi"); err != nil {
			return err
		}
	} else {
		nc.Storage = &resource.Quantity{}
	}
	return nil
}

func getProjectResourceQuota(ctx context.Context, request interface{}, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter,
	quotaProvider provider.ResourceQuotaProvider) (*kubermaticv1.ResourceQuota, string, error) {
	req, ok := request.(common.GetProjectRq)
	if !ok {
		return nil, "", utilerrors.NewBadRequest("invalid request")
	}
	if len(req.ProjectID) == 0 {
		return nil, "", utilerrors.NewBadRequest("the id of the project cannot be empty")
	}

	kubermaticProject, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
	if err != nil {
		return nil, "", common.KubernetesErrorToHTTPError(err)
	}

	userInfo, err := userInfoGetter(ctx, kubermaticProject.Name)
	if err != nil {
		return nil, "", err
	}

	projectResourceQuota, err := quotaProvider.Get(ctx, userInfo, kubermaticProject.Name, strings.ToLower(kubermaticv1.ProjectKindName))
	if err != nil {
		return nil, "", common.KubernetesErrorToHTTPError(err)
	}
	return projectResourceQuota, kubermaticProject.Spec.Name, err
}

func ListResourceQuotas(ctx context.Context, request interface{}, provider provider.ResourceQuotaProvider, projectProvider provider.ProjectProvider) ([]*apiv2.ResourceQuota, error) {
	req, ok := request.(listResourceQuotas)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	labelSet := make(map[string]string)
	if req.SubjectKind != "" {
		labelSet[kubermaticv1.ResourceQuotaSubjectKindLabelKey] = req.SubjectKind
	}
	if req.SubjectName != "" {
		labelSet[kubermaticv1.ResourceQuotaSubjectNameLabelKey] = req.SubjectName
	}

	resourceQuotaList, err := provider.ListUnsecured(ctx, labelSet)
	if err != nil {
		return nil, err
	}

	// if accumulate is true, accumulate all resource quota's quotas and global usage and return
	if req.Accumulate {
		return []*apiv2.ResourceQuota{accumulateQuotas(resourceQuotaList)}, nil
	}

	// Fetching projects to get their human-readable names.
	projectMap := make(map[string]*kubermaticv1.Project)
	projects, err := projectProvider.List(ctx, nil)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	for _, project := range projects {
		projectMap[project.Name] = project
	}
	projectSet := sets.KeySet(projectMap)

	resp := make([]*apiv2.ResourceQuota, len(resourceQuotaList.Items))
	for idx, rq := range resourceQuotaList.Items {
		var humanReadableName string
		if rq.Spec.Subject.Kind == kubermaticv1.ProjectSubjectKind {
			if projectSet.Has(rq.Spec.Subject.Name) {
				humanReadableName = projectMap[rq.Spec.Subject.Name].Spec.Name
			}
		}
		resp[idx] = convertToAPIStruct(&rq, humanReadableName)
	}

	return resp, nil
}

func CreateResourceQuota(ctx context.Context, request interface{}, provider provider.ResourceQuotaProvider) error {
	req, ok := request.(createResourceQuota)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}

	if err := req.Validate(); err != nil {
		return utilerrors.NewBadRequest("%v", err)
	}

	crdQuota, err := apiv2.ConvertToCRDQuota(req.Body.Quota)
	if err != nil {
		return utilerrors.NewBadRequest("%v", err)
	}

	if err := provider.CreateUnsecured(ctx, kubermaticv1.Subject{Name: req.Body.SubjectName, Kind: req.Body.SubjectKind}, crdQuota); err != nil {
		if apierrors.IsAlreadyExists(err) {
			name := buildNameFromSubject(kubermaticv1.Subject{Name: req.Body.SubjectName, Kind: req.Body.SubjectKind})
			return utilerrors.NewAlreadyExists("ResourceQuota", name)
		}
		return err
	}
	return nil
}

func PutResourceQuota(ctx context.Context, request interface{}, provider provider.ResourceQuotaProvider) error {
	req, ok := request.(putResourceQuota)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}

	originalResourceQuota, err := provider.GetUnsecured(ctx, req.Name)
	if err != nil {
		if apierrors.IsNotFound(err) {
			return utilerrors.NewNotFound("ResourceQuota", req.Name)
		}
		return err
	}
	newResourceQuota := originalResourceQuota.DeepCopy()

	// if a resource quota is updated, it's not a default quota anymore. Remove default label if it exists
	delete(newResourceQuota.Labels, DefaultProjectResourceQuotaLabel)

	crdQuota, err := apiv2.ConvertToCRDQuota(req.Body)
	if err != nil {
		return utilerrors.NewBadRequest("%v", err)
	}
	newResourceQuota.Spec.Quota = crdQuota

	if err := provider.PatchUnsecured(ctx, originalResourceQuota, newResourceQuota); err != nil {
		if apierrors.IsNotFound(err) {
			return utilerrors.NewNotFound("ResourceQuota", req.Name)
		}
		return err
	}
	return nil
}

func convertToAPIStruct(resourceQuota *kubermaticv1.ResourceQuota, humanReadableSubjectName string) *apiv2.ResourceQuota {
	rq := &apiv2.ResourceQuota{
		Name:        resourceQuota.Name,
		SubjectName: resourceQuota.Spec.Subject.Name,
		SubjectKind: resourceQuota.Spec.Subject.Kind,
		Quota:       apiv2.ConvertToAPIQuota(resourceQuota.Spec.Quota),
		Status: apiv2.ResourceQuotaStatus{
			GlobalUsage: apiv2.ConvertToAPIQuota(resourceQuota.Status.GlobalUsage),
			LocalUsage:  apiv2.ConvertToAPIQuota(resourceQuota.Status.LocalUsage),
		},
		SubjectHumanReadableName: humanReadableSubjectName,
	}

	if resourceQuota.Labels != nil && resourceQuota.Labels[DefaultProjectResourceQuotaLabel] == "true" {
		rq.IsDefault = true
	}

	return rq
}

func DeleteResourceQuota(ctx context.Context, request interface{}, provider provider.ResourceQuotaProvider) error {
	req, ok := request.(getResourceQuota)
	if !ok {
		return utilerrors.NewBadRequest("invalid request")
	}

	if err := provider.DeleteUnsecured(ctx, req.Name); err != nil {
		if apierrors.IsNotFound(err) {
			return utilerrors.NewNotFound("ResourceQuota", req.Name)
		}
		return err
	}
	return nil
}
