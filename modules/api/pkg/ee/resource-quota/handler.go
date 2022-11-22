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
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	kubermaticprovider "k8c.io/kubermatic/v2/pkg/provider"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/util/sets"
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
	Body struct {
		Replicas int `json:"replicas"`
		// DiskSizeGB will be processed only for those providers which don't have the disk size in their API objects, like AWS, Alibabla and GCP.
		DiskSizeGB          int                        `json:"diskSizeGB,omitempty"`
		AlibabaInstanceType *apiv1.AlibabaInstanceType `json:"alibabaInstanceType,omitempty"`
		AnexiaNodeSpec      *apiv1.AnexiaNodeSpec      `json:"anexiaNodeSpec,omitempty"`
		AWSSize             *apiv1.AWSSize             `json:"awsSize,omitempty"`
		AzureSize           *apiv1.AzureSize           `json:"azureSize,omitempty"`
		DOSize              *apiv1.DigitaloceanSize    `json:"doSize,omitempty"`
		EquinixSize         *apiv1.PacketSize          `json:"equinixSize,omitempty"`
		GCPSize             *apiv1.GCPMachineSize      `json:"gcpSize,omitempty"`
		HetznerSize         *apiv1.HetznerSize         `json:"hetznerSize,omitempty"`
		// TODO Kubevirt
		NutanixNodeSpec    *apiv1.NutanixNodeSpec             `json:"nutanixNodeSpec,omitempty"`
		OpenstackSize      *apiv1.OpenstackSize               `json:"openstackSize,omitempty"`
		VMDirectorNodeSpec *apiv1.VMwareCloudDirectorNodeSpec `json:"vmDirectorNodeSpec,omitempty"`
		VSphereNodeSpec    *apiv1.VSphereNodeSpec             `json:"vSphereNodeSpec,omitempty"`
	}
}

// swagger:parameters listResourceQuotas
type listResourceQuotas struct {
	// in: query
	// required: false
	SubjectName string `json:"subject_name,omitempty"`

	// in: query
	// required: false
	SubjectKind string `json:"subject_kind,omitempty"`
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

	req.SubjectName = r.URL.Query().Get("subjectName")
	req.SubjectKind = r.URL.Query().Get("subjectKind")

	return req, nil
}

func DecodeCreateResourceQuotaReq(r *http.Request) (interface{}, error) {
	var req createResourceQuota

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, utilerrors.NewBadRequest(err.Error())
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
		return nil, utilerrors.NewBadRequest(err.Error())
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

func CalculateResourceQuotaUpdateForProject(ctx context.Context, request interface{}, projectProvider provider.ProjectProvider,
	privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter,
	quotaProvider provider.ResourceQuotaProvider) (*apiv2.ResourceQuotaUpdateCalculation, error) {
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

	calculatedResources, err := getResourceDetailsFromRequest(req)
	if err != nil {
		return nil, utilerrors.NewBadRequest("invalid request, failed getting resources from request body: %v", err)
	}

	// Add the current global usage
	if projectResourceQuota.Status.GlobalUsage.CPU != nil && calculatedResources.CPU != nil {
		calculatedResources.CPU.Add(*projectResourceQuota.Status.GlobalUsage.CPU)
	}
	if projectResourceQuota.Status.GlobalUsage.Memory != nil && calculatedResources.Memory != nil {
		calculatedResources.Memory.Add(*projectResourceQuota.Status.GlobalUsage.Memory)
	}
	if projectResourceQuota.Status.GlobalUsage.Storage != nil && calculatedResources.Storage != nil {
		calculatedResources.Storage.Add(*projectResourceQuota.Status.GlobalUsage.Storage)
	}

	// check if quota is exceeded
	var msg string
	if projectResourceQuota.Spec.Quota.CPU != nil && calculatedResources.CPU != nil &&
		calculatedResources.CPU.Cmp(*projectResourceQuota.Spec.Quota.CPU) > 0 {
		msg += fmt.Sprintf("Calculated cpu (%s) exceeds resource quota (%s)", calculatedResources.CPU, projectResourceQuota.Spec.Quota.CPU)
	}
	if projectResourceQuota.Spec.Quota.Memory != nil && calculatedResources.Memory != nil &&
		calculatedResources.Memory.Cmp(*projectResourceQuota.Spec.Quota.Memory) > 0 {
		msg += fmt.Sprintf("Calculated memory (%s) exceeds resource quota (%s)", calculatedResources.Memory, projectResourceQuota.Spec.Quota.Memory)
	}
	if projectResourceQuota.Spec.Quota.Storage != nil && calculatedResources.Storage != nil &&
		calculatedResources.Storage.Cmp(*projectResourceQuota.Spec.Quota.Storage) > 0 {
		msg += fmt.Sprintf("Calculated disk size (%s) exceeds resource quota (%s)", calculatedResources.Storage, projectResourceQuota.Spec.Quota.Storage)
	}

	return &apiv2.ResourceQuotaUpdateCalculation{
		ResourceQuota:   *convertToAPIStruct(projectResourceQuota, projectName),
		CalculatedQuota: convertToAPIQuota(*calculatedResources),
		Message:         msg,
	}, nil
}

func getResourceDetailsFromRequest(req calculateProjectResourceQuotaUpdate) (*kubermaticv1.ResourceDetails, error) {
	nc := kubermaticprovider.NodeCapacity{}

	var err error

	if req.Body.AlibabaInstanceType != nil {
		nc.WithCPUCount(req.Body.AlibabaInstanceType.CPUCoreCount)

		if err = nc.WithMemory(int(req.Body.AlibabaInstanceType.MemorySize), "G"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.DiskSizeGB, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.AnexiaNodeSpec != nil {
		nc.WithCPUCount(req.Body.AnexiaNodeSpec.CPUs)

		if err = nc.WithMemory(int(req.Body.AnexiaNodeSpec.Memory), "M"); err != nil {
			return nil, err
		}

		var diskSize int64
		for _, disk := range req.Body.AnexiaNodeSpec.Disks {
			diskSize += disk.Size
		}
		if err = nc.WithStorage(int(diskSize), "G"); err != nil {
			return nil, err
		}
	} else if req.Body.AWSSize != nil {
		nc.WithCPUCount(req.Body.AWSSize.VCPUs)

		if err = nc.WithMemory(int(req.Body.AWSSize.Memory), "G"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.DiskSizeGB, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.AzureSize != nil {
		nc.WithCPUCount(int(req.Body.AzureSize.NumberOfCores))

		if err = nc.WithMemory(int(req.Body.AzureSize.MemoryInMB), "M"); err != nil {
			return nil, err
		}

		if err = nc.WithStorage(int(req.Body.AzureSize.ResourceDiskSizeInMB+req.Body.AzureSize.OsDiskSizeInMB), "M"); err != nil {
			return nil, err
		}
	} else if req.Body.DOSize != nil {
		nc.WithCPUCount(req.Body.DOSize.VCPUs)

		if err = nc.WithMemory(req.Body.DOSize.Memory, "M"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.DOSize.Disk, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.EquinixSize != nil {
		var cpuCount int
		for _, c := range req.Body.EquinixSize.CPUs {
			cpuCount += c.Count
		}
		nc.WithCPUCount(cpuCount)

		// trimming "B" as quantities must match the regular expression '^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$'.
		memory, err := resource.ParseQuantity(strings.TrimSuffix(req.Body.EquinixSize.Memory, "B"))
		if err != nil {
			return nil, err
		}
		nc.Memory = &memory

		var allDrivesStorage resource.Quantity
		for _, drive := range req.Body.EquinixSize.Drives {
			if drive.Size == "" || drive.Count == 0 {
				continue
			}

			storage, err := resource.ParseQuantity(strings.TrimSuffix(drive.Size, "B"))
			if err != nil {
				return nil, err
			}

			// total storage for each types = drive count *drive Size.
			strDrive := strconv.FormatInt(storage.Value()*int64(drive.Count), 10)
			totalStorage, err := resource.ParseQuantity(strDrive)
			if err != nil {
				return nil, err
			}
			allDrivesStorage.Add(totalStorage)
		}
		nc.Storage = &allDrivesStorage
	} else if req.Body.GCPSize != nil {
		nc.WithCPUCount(int(req.Body.GCPSize.VCPUs))

		if err = nc.WithMemory(int(req.Body.GCPSize.Memory), "M"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.DiskSizeGB, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.HetznerSize != nil {
		nc.WithCPUCount(req.Body.HetznerSize.Cores)

		if err = nc.WithMemory(int(req.Body.HetznerSize.Memory), "G"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.HetznerSize.Disk, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.NutanixNodeSpec != nil {
		nc.WithCPUCount(int(req.Body.NutanixNodeSpec.CPUs))

		if err = nc.WithMemory(int(req.Body.NutanixNodeSpec.MemoryMB), "M"); err != nil {
			return nil, err
		}

		if req.Body.NutanixNodeSpec.DiskSize != nil {
			if err = nc.WithStorage(int(*req.Body.NutanixNodeSpec.DiskSize), "G"); err != nil {
				return nil, err
			}
		} else {
			nc.Storage = &resource.Quantity{}
		}

	} else if req.Body.OpenstackSize != nil {
		nc.WithCPUCount(req.Body.OpenstackSize.VCPUs)

		if err = nc.WithMemory(req.Body.OpenstackSize.Memory, "G"); err != nil {
			return nil, err
		}
		if err = nc.WithStorage(req.Body.OpenstackSize.Disk, "G"); err != nil {
			return nil, err
		}
	} else if req.Body.VSphereNodeSpec != nil {
		nc.WithCPUCount(req.Body.VSphereNodeSpec.CPUs)

		if err = nc.WithMemory(req.Body.VSphereNodeSpec.Memory, "G"); err != nil {
			return nil, err
		}

		if req.Body.VSphereNodeSpec.DiskSizeGB != nil {
			if err = nc.WithStorage(int(*req.Body.VSphereNodeSpec.DiskSizeGB), "G"); err != nil {
				return nil, err
			}
		} else {
			nc.Storage = &resource.Quantity{}
		}

	} else if req.Body.VMDirectorNodeSpec != nil {
		nc.WithCPUCount(req.Body.VMDirectorNodeSpec.CPUCores * req.Body.VMDirectorNodeSpec.CPUs)

		if err = nc.WithMemory(req.Body.VMDirectorNodeSpec.MemoryMB, "M"); err != nil {
			return nil, err
		}

		if req.Body.VMDirectorNodeSpec.DiskSizeGB != nil {
			if err = nc.WithStorage(int(*req.Body.VMDirectorNodeSpec.DiskSizeGB), "G"); err != nil {
				return nil, err
			}
		} else {
			nc.Storage = &resource.Quantity{}
		}
	} else {
		return nil, fmt.Errorf("provider set in request not supported: %v", req.Body)
	}

	// These should not happen, unless we have a bug in the setting resource values code above
	if nc.CPUCores == nil {
		return nil, fmt.Errorf("cpu not set in the request: %v", req.Body)
	}
	if nc.Memory == nil {
		return nil, fmt.Errorf("memory not set in the request: %v", req.Body)
	}
	if nc.Storage == nil {
		return nil, fmt.Errorf("storage not set in the request: %v", req.Body)
	}

	// Multiply by replicas count
	var cpu, mem, sto resource.Quantity
	for i := 0; i < req.Body.Replicas; i++ {
		cpu.Add(*nc.CPUCores)
		mem.Add(*nc.Memory)
		sto.Add(*nc.Storage)
	}

	rd := kubermaticv1.NewResourceDetails(cpu, mem, sto)

	return rd, nil
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

	// Fetching projects to get their human-readable names.
	projectMap := make(map[string]*kubermaticv1.Project)
	projects, err := projectProvider.List(ctx, nil)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	for _, project := range projects {
		projectMap[project.Name] = project
	}
	projectSet := sets.StringKeySet(projectMap)

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
		return utilerrors.NewBadRequest(err.Error())
	}

	crdQuota, err := convertToCRDQuota(req.Body.Quota)
	if err != nil {
		return utilerrors.NewBadRequest(err.Error())
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

	crdQuota, err := convertToCRDQuota(req.Body)
	if err != nil {
		return utilerrors.NewBadRequest(err.Error())
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
	return &apiv2.ResourceQuota{
		Name:        resourceQuota.Name,
		SubjectName: resourceQuota.Spec.Subject.Name,
		SubjectKind: resourceQuota.Spec.Subject.Kind,
		Quota:       convertToAPIQuota(resourceQuota.Spec.Quota),
		Status: apiv2.ResourceQuotaStatus{
			GlobalUsage: convertToAPIQuota(resourceQuota.Status.GlobalUsage),
			LocalUsage:  convertToAPIQuota(resourceQuota.Status.LocalUsage),
		},
		SubjectHumanReadableName: humanReadableSubjectName,
	}
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

func convertToAPIQuota(resourceDetails kubermaticv1.ResourceDetails) apiv2.Quota {
	quota := apiv2.Quota{}

	if resourceDetails.CPU != nil {
		cpu := resourceDetails.CPU.Value()
		quota.CPU = &cpu
	}

	// Get memory and storage denoted in GB
	if resourceDetails.Memory != nil && !resourceDetails.Memory.IsZero() {
		memory := float64(resourceDetails.Memory.Value()) / math.Pow10(int(resource.Giga))
		// round to 2 decimal places
		memory = math.Round(memory*100) / 100
		quota.Memory = &memory
	}

	if resourceDetails.Storage != nil && !resourceDetails.Storage.IsZero() {
		storage := float64(resourceDetails.Storage.Value()) / math.Pow10(int(resource.Giga))
		// round to 2 decimal places
		storage = math.Round(storage*100) / 100
		quota.Storage = &storage
	}

	return quota
}

func convertToCRDQuota(quota apiv2.Quota) (kubermaticv1.ResourceDetails, error) {
	resourceDetails := kubermaticv1.ResourceDetails{}
	var cpu, mem, storage resource.Quantity
	var err error

	if quota.CPU != nil {
		cpu, err = resource.ParseQuantity(fmt.Sprintf("%d", *quota.CPU))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota CPU %w", err)
		}
		resourceDetails.CPU = &cpu
	}

	if quota.Memory != nil {
		mem, err = resource.ParseQuantity(fmt.Sprintf("%fG", *quota.Memory))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Memory %w", err)
		}
		resourceDetails.Memory = &mem
	}

	if quota.Storage != nil {
		storage, err = resource.ParseQuantity(fmt.Sprintf("%fG", *quota.Storage))
		if err != nil {
			return kubermaticv1.ResourceDetails{}, fmt.Errorf("error parsing quota Memory %w", err)
		}
		resourceDetails.Storage = &storage
	}

	return resourceDetails, nil
}
