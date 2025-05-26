/*
Copyright 2021 The Kubermatic Kubernetes Platform contributors.

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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	kvinstancetypev1alpha1 "kubevirt.io/api/instancetype/v1alpha1"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt"
	kvmanifests "k8c.io/dashboard/v2/pkg/provider/cloud/kubevirt/manifests"
	kubernetesprovider "k8c.io/dashboard/v2/pkg/provider/kubernetes"
	"k8c.io/dashboard/v2/pkg/resources/reconciling"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/sets"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

var NewKubeVirtClient = kubevirt.NewClient

func getKvKubeConfigFromCredentials(ctx context.Context, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	userInfoGetter provider.UserInfoGetter, projectID, clusterID string) (string, error) {
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return "", err
	}

	if cluster.Spec.Cloud.Kubevirt == nil {
		return "", utilerrors.NewNotFound("cloud spec for ", clusterID)
	}

	assertedClusterProvider, ok := clusterProvider.(*kubernetesprovider.ClusterProvider)
	if !ok {
		return "", utilerrors.New(http.StatusInternalServerError, "failed to assert clusterProvider")
	}

	secretKeySelector := provider.SecretKeySelectorValueFuncFactory(ctx, assertedClusterProvider.GetSeedClusterAdminRuntimeClient())
	kvKubeconfig, err := kubevirt.GetCredentialsForCluster(cluster.Spec.Cloud, secretKeySelector)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(kvKubeconfig)), nil
}

func KubeVirtInstancetypesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string, settingsProvider provider.SettingsProvider) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, err
	}

	return KubeVirtInstancetypes(ctx, projectID, kvKubeconfig, cluster.Spec.Cloud.DatacenterName, cluster, settingsProvider, userInfoGetter, seedsGetter)
}

func KubeVirtPreferencesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string, settingsProvider provider.SettingsProvider) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, err
	}

	return KubeVirtPreferences(ctx, projectID, kvKubeconfig, cluster.Spec.Cloud.DatacenterName, cluster, settingsProvider, userInfoGetter, seedsGetter)
}

func KubeVirtStorageClasses(ctx context.Context, kubeconfig, datacenterName string, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (apiv2.StorageClassList, error) {
	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	storageClasses := apiv2.StorageClassList{}
	for _, sc := range datacenter.Spec.Kubevirt.InfraStorageClasses {
		if sc.VolumeProvisioner == kubermaticv1.KubeVirtCSIDriver {
			continue
		}
		storageClasses = append(storageClasses, apiv2.StorageClass{Name: sc.Name})
	}
	if len(storageClasses) > 0 {
		return storageClasses, nil
	}

	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	return kubevirt.ListStorageClasses(ctx, client, nil)
}

func KubeVirtStorageClassesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID string) (interface{}, error) {
	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	var datacenterName string
	if cluster != nil {
		datacenterName = cluster.Spec.Cloud.DatacenterName
	}

	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return KubeVirtStorageClasses(ctx, kvKubeconfig, datacenterName, userInfoGetter, seedsGetter)
}

func KubeVirtVPCsWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	_ provider.SeedsGetter, projectID, clusterID string) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return KubeVirtVPCs(ctx, kvKubeconfig)
}

func KubeVirtSubnetsWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	seedsGetter provider.SeedsGetter, projectID, clusterID, storageClassName string) (interface{}, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return "", err
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, cluster.Spec.Cloud.DatacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	if datacenter.Spec.Kubevirt != nil &&
		datacenter.Spec.Kubevirt.ProviderNetwork != nil &&
		len(datacenter.Spec.Kubevirt.ProviderNetwork.VPCs) > 0 {
		kvSubnets := apiv2.KubeVirtSubnetList{}
		for _, vpc := range datacenter.Spec.Kubevirt.ProviderNetwork.VPCs {
			if cluster.Spec.Cloud.Kubevirt.VPCName == vpc.Name {
				for _, subnet := range vpc.Subnets {
					if datacenter.Spec.Kubevirt.MatchSubnetAndStorageLocation != nil && *datacenter.Spec.Kubevirt.MatchSubnetAndStorageLocation {
						for _, sc := range datacenter.Spec.Kubevirt.InfraStorageClasses {
							if storageClassName == "" && sc.IsDefaultClass != nil && *sc.IsDefaultClass {
								storageClassName = sc.Name
							}
							if sc.Name == storageClassName {
								scRegions := sets.New[string]().Insert(sc.Regions...)
								scZones := sets.New[string]().Insert(sc.Zones...)

								if scRegions.HasAll(subnet.Regions...) && scZones.HasAll(subnet.Zones...) {
									kvSubnet := apiv2.KubeVirtSubnet{
										Name: subnet.Name,
										CIDR: subnet.CIDR,
									}

									kvSubnets = append(kvSubnets, kvSubnet)
								}
							}
						}
					} else {
						kvSubnet := apiv2.KubeVirtSubnet{
							Name: subnet.Name,
							CIDR: subnet.CIDR,
						}

						kvSubnets = append(kvSubnets, kvSubnet)
					}
				}
			}
		}

		return kvSubnets, nil
	}

	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	if cluster.Spec.Cloud.Kubevirt == nil {
		return "", utilerrors.NewNotFound("cloud spec for ", clusterID)
	}

	return KubeVirtVPCSubnets(ctx, kvKubeconfig, cluster.Spec.Cloud.Kubevirt.VPCName)
}

// kubeVirtInstancetypes returns the kvinstancetypev1alpha1.VirtualMachineInstanceType:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests.
func kubeVirtInstancetypes(ctx context.Context, client ctrlruntimeclient.Client, datacenter *kubermaticv1.Datacenter) (instancetypeListWrapper, error) {
	instancetypes := instancetypeListWrapper{}
	customInstancetypes := kvinstancetypev1alpha1.VirtualMachineClusterInstancetypeList{}
	standardInstancetypes := kvinstancetypev1alpha1.VirtualMachineInstancetypeList{}
	// "custom" (cluster-wide)
	if err := client.List(ctx, &customInstancetypes); err != nil {
		return instancetypes, err
	}
	// "standard" (namespaced)
	if datacenter.Spec.Kubevirt != nil && !datacenter.Spec.Kubevirt.DisableDefaultInstanceTypes {
		standardInstancetypes.Items = kubevirt.GetKubermaticStandardInstancetypes(client, &kvmanifests.StandardInstancetypeGetter{})
	}

	// Wrap
	if len(customInstancetypes.Items) > 0 || len(standardInstancetypes.Items) > 0 {
		instancetypes.items = make([]instancetypeWrapper, 0)
	}
	for i := range customInstancetypes.Items {
		w := customInstancetypeWrapper{&customInstancetypes.Items[i]}
		instancetypes.items = append(instancetypes.items, &w)
	}
	for i := range standardInstancetypes.Items {
		w := standardInstancetypeWrapper{&standardInstancetypes.Items[i]}
		instancetypes.items = append(instancetypes.items, &w)
	}

	return instancetypes, nil
}

func newAPIInstancetype(w instancetypeWrapper) (*apiv2.VirtualMachineInstancetype, error) {
	spec, err := json.Marshal(w.Spec())
	if err != nil {
		return nil, err
	}

	return &apiv2.VirtualMachineInstancetype{
		Name: w.GetObjectMeta().GetName(),
		Spec: string(spec),
	}, nil
}

func newAPIPreference(w preferenceWrapper) (*apiv2.VirtualMachinePreference, error) {
	spec, err := json.Marshal(w.Spec())
	if err != nil {
		return nil, err
	}

	return &apiv2.VirtualMachinePreference{
		Name: w.GetObjectMeta().GetName(),
		Spec: string(spec),
	}, nil
}

// KubeVirtInstancetypes returns the apiv2.VirtualMachineInstanceType:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests
// The list is filtered based on the Resource Quota.
func KubeVirtInstancetypes(ctx context.Context, projectID, kubeconfig, datacenterName string, cluster *kubermaticv1.Cluster, settingsProvider provider.SettingsProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (*apiv2.VirtualMachineInstancetypeList, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}
	instancetypes, err := kubeVirtInstancetypes(ctx, client, datacenter)
	if err != nil {
		return nil, err
	}

	// conversion to api type
	res, err := instancetypes.toApi()
	if err != nil {
		return nil, err
	}

	var infraNS string
	if cluster != nil {
		infraNS = cluster.Status.NamespaceName
	}

	if datacenter.Spec.Kubevirt != nil && datacenter.Spec.Kubevirt.NamespacedMode != nil && datacenter.Spec.Kubevirt.NamespacedMode.Enabled {
		infraNS = datacenter.Spec.Kubevirt.NamespacedMode.Namespace
	}

	// Reconcile Kubermatic Standard (update flow)
	for _, it := range instancetypes.items {
		if it.Category() == apiv2.InstancetypeKubermatic {
			if cluster != nil {
				instancetypeReconcilers := []reconciling.NamedVirtualMachineInstancetypeReconcilerFactory{
					instancetypeReconciler(it),
				}
				if err := reconciling.ReconcileVirtualMachineInstancetypes(ctx, instancetypeReconcilers, infraNS, client); err != nil {
					return nil, err
				}
			}
		}
	}

	settings, err := settingsProvider.GetGlobalSettings(ctx)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	filter := *settings.Spec.MachineDeploymentVMResourceQuota
	if datacenterName != "" {
		filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
	}

	return filterInstancetypes(res, filter), nil
}

// kubeVirtPreferences returns the kvinstancetypev1alpha1.VirtualMachinePreference:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests.
func kubeVirtPreferences(ctx context.Context, client ctrlruntimeclient.Client, datacenter *kubermaticv1.Datacenter) (preferenceListWrapper, error) {
	preferences := preferenceListWrapper{}
	customPreferences := kvinstancetypev1alpha1.VirtualMachineClusterPreferenceList{}
	standardPreferences := kvinstancetypev1alpha1.VirtualMachinePreferenceList{}
	// "custom" (cluster-wide)
	if err := client.List(ctx, &customPreferences); err != nil {
		return preferences, err
	}
	// "standard" (namespaced)
	if datacenter.Spec.Kubevirt != nil && !datacenter.Spec.Kubevirt.DisableDefaultPreferences {
		standardPreferences.Items = kubevirt.GetKubermaticStandardPreferences(client, &kvmanifests.StandardPreferenceGetter{})
	}

	// Wrap
	if len(customPreferences.Items) > 0 || len(standardPreferences.Items) > 0 {
		preferences.items = make([]preferenceWrapper, 0)
	}
	for i := range customPreferences.Items {
		w := customPreferenceWrapper{&customPreferences.Items[i]}
		preferences.items = append(preferences.items, &w)
	}
	for i := range standardPreferences.Items {
		w := standardPreferenceWrapper{&standardPreferences.Items[i]}
		preferences.items = append(preferences.items, &w)
	}

	return preferences, nil
}

// KubeVirtPreferences returns the apiv2.VirtualMachinePreference:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests.
// No filtering due to quota is needed.
func KubeVirtPreferences(ctx context.Context, projectID, kubeconfig, datacenterName string, cluster *kubermaticv1.Cluster, _ provider.SettingsProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (*apiv2.VirtualMachinePreferenceList, error) {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	preferences, err := kubeVirtPreferences(ctx, client, datacenter)
	if err != nil {
		return nil, err
	}

	// conversion to api type
	res, err := preferences.toApi()
	if err != nil {
		return nil, err
	}

	var infraNS string
	if cluster != nil {
		infraNS = cluster.Status.NamespaceName
	}

	if datacenter.Spec.Kubevirt != nil && datacenter.Spec.Kubevirt.NamespacedMode != nil && datacenter.Spec.Kubevirt.NamespacedMode.Enabled {
		infraNS = datacenter.Spec.Kubevirt.NamespacedMode.Namespace
	}

	// Reconcile Kubermatic Standard (update flow)
	for _, it := range preferences.items {
		if it.Category() == apiv2.InstancetypeKubermatic {
			if cluster != nil {
				preferenceReconcilers := []reconciling.NamedVirtualMachinePreferenceReconcilerFactory{
					preferenceReconciler(it),
				}
				if err := reconciling.ReconcileVirtualMachinePreferences(ctx, preferenceReconcilers, infraNS, client); err != nil {
					return nil, err
				}
			}
		}
	}

	return res, nil
}

func KubeVirtVPCs(ctx context.Context, kubeconfig string) (apiv2.KubeVirtVPCList, error) {
	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	vpcList, err := kubevirt.GetProviderNetworkVPCs(ctx, client)
	if err != nil {
		return nil, err
	}

	var vpcAPIList apiv2.KubeVirtVPCList
	for _, vpc := range vpcList {
		vpcAPIList = append(vpcAPIList, apiv2.KubeVirtVPC{Name: vpc})
	}

	return vpcAPIList, nil
}

func KubeVirtVPCSubnets(ctx context.Context, kubeconfig string, vpcName string) (apiv2.KubeVirtSubnetList, error) {
	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	subnets, err := kubevirt.GetProviderNetworkSubnets(ctx, client, vpcName)
	if err != nil {
		return nil, err
	}

	var subnetAPIList apiv2.KubeVirtSubnetList
	for _, subnet := range subnets {
		subnetAPIList = append(subnetAPIList, apiv2.KubeVirtSubnet{Name: subnet})
	}
	return subnetAPIList, nil
}

func instancetypeReconciler(w instancetypeWrapper) reconciling.NamedVirtualMachineInstancetypeReconcilerFactory {
	return func() (string, reconciling.VirtualMachineInstancetypeReconciler) {
		return w.GetObjectMeta().GetName(), func(it *kvinstancetypev1alpha1.VirtualMachineInstancetype) (*kvinstancetypev1alpha1.VirtualMachineInstancetype, error) {
			it.Labels = w.GetObjectMeta().GetLabels()
			it.Spec = w.Spec()
			return it, nil
		}
	}
}

func preferenceReconciler(w preferenceWrapper) reconciling.NamedVirtualMachinePreferenceReconcilerFactory {
	return func() (string, reconciling.VirtualMachinePreferenceReconciler) {
		return w.GetObjectMeta().GetName(), func(it *kvinstancetypev1alpha1.VirtualMachinePreference) (*kvinstancetypev1alpha1.VirtualMachinePreference, error) {
			it.Labels = w.GetObjectMeta().GetLabels()
			it.Spec = w.Spec()
			return it, nil
		}
	}
}

func filterInstancetypes(instancetypes *apiv2.VirtualMachineInstancetypeList, machineFilter kubermaticv1.MachineFlavorFilter) *apiv2.VirtualMachineInstancetypeList {
	filtered := &apiv2.VirtualMachineInstancetypeList{}

	// Range over the records and apply all the filters to each record.
	// If the record passes all the filters, add it to the final slice.
	for category, types := range instancetypes.Instancetypes {
		for _, instancetype := range types {
			spec := kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec{}
			if err := json.Unmarshal([]byte(instancetype.Spec), &spec); err != nil {
				log.Logger.Errorf("skipping VirtualMachineInstancetype:%s, parsing instancetype.Spec failed:%v", instancetype.Name, err)
				continue
			}
			if handlercommon.FilterCPU(int(spec.CPU.Guest), machineFilter.MinCPU, machineFilter.MaxCPU) && handlercommon.FilterMemory(int(spec.Memory.Guest.Value()/(1<<30)), machineFilter.MinRAM, machineFilter.MaxRAM) {
				if filtered.Instancetypes == nil {
					filtered.Instancetypes = make(map[apiv2.VirtualMachineInstancetypeCategory][]apiv2.VirtualMachineInstancetype, 0)
				}
				if filtered.Instancetypes[category] == nil {
					filtered.Instancetypes[category] = make([]apiv2.VirtualMachineInstancetype, 0)
				}

				// Convert memory from BinarySI to DecimalSI.
				spec.Memory.Guest = *resource.NewScaledQuantity(spec.Memory.Guest.ScaledValue(resource.Mega), resource.Mega)
				specWithScaledMem, err := json.Marshal(spec)
				if err != nil {
					log.Logger.Errorf("skipping spec conversion, parsing failed:%v", spec)
				} else {
					instancetype.Spec = string(specWithScaledMem)
				}

				filtered.Instancetypes[category] = append(filtered.Instancetypes[category], instancetype)
			}
		}
	}
	return filtered
}

// instancetypeWrapper to wrap functions needed to convert to API type:
//   - kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec, kvinstancetypev1alpha1.VirtualMachineClusterInstancetypeSpec
type instancetypeWrapper interface {
	Spec() kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec
	Category() apiv2.VirtualMachineInstancetypeCategory
	GetObjectMeta() metav1.Object
}

type customInstancetypeWrapper struct {
	*kvinstancetypev1alpha1.VirtualMachineClusterInstancetype
}

func (it *customInstancetypeWrapper) Category() apiv2.VirtualMachineInstancetypeCategory {
	return apiv2.InstancetypeCustom
}

func (it *customInstancetypeWrapper) Spec() kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec {
	return it.VirtualMachineClusterInstancetype.Spec
}

type standardInstancetypeWrapper struct {
	*kvinstancetypev1alpha1.VirtualMachineInstancetype
}

func (it *standardInstancetypeWrapper) Category() apiv2.VirtualMachineInstancetypeCategory {
	return apiv2.InstancetypeKubermatic
}

func (it *standardInstancetypeWrapper) Spec() kvinstancetypev1alpha1.VirtualMachineInstancetypeSpec {
	return it.VirtualMachineInstancetype.Spec
}

type instancetypeListWrapper struct {
	items []instancetypeWrapper
}

// toApi converts to apiv2 types.
func (l *instancetypeListWrapper) toApi() (*apiv2.VirtualMachineInstancetypeList, error) {
	res := &apiv2.VirtualMachineInstancetypeList{}
	if len(l.items) > 0 {
		res.Instancetypes = make(map[apiv2.VirtualMachineInstancetypeCategory][]apiv2.VirtualMachineInstancetype)
		for _, it := range l.items {
			instancetype, err := newAPIInstancetype(it)
			if err != nil {
				return nil, err
			}
			res.Instancetypes[it.Category()] = append(res.Instancetypes[it.Category()], *instancetype)
		}
	}
	return res, nil
}

// preferenceWrapper to wrap functions needed to convert to API type:
//   - kvinstancetypev1alpha1.VirtualMachinePreferenceSpec, kvinstancetypev1alpha1.VirtualMachineClusterPreferenceSpec
type preferenceWrapper interface {
	Spec() kvinstancetypev1alpha1.VirtualMachinePreferenceSpec
	Category() apiv2.VirtualMachineInstancetypeCategory
	GetObjectMeta() metav1.Object
}

type customPreferenceWrapper struct {
	*kvinstancetypev1alpha1.VirtualMachineClusterPreference
}

func (p *customPreferenceWrapper) Category() apiv2.VirtualMachineInstancetypeCategory {
	return apiv2.InstancetypeCustom
}

func (p *customPreferenceWrapper) Spec() kvinstancetypev1alpha1.VirtualMachinePreferenceSpec {
	return p.VirtualMachineClusterPreference.Spec
}

type standardPreferenceWrapper struct {
	*kvinstancetypev1alpha1.VirtualMachinePreference
}

func (p *standardPreferenceWrapper) Category() apiv2.VirtualMachineInstancetypeCategory {
	return apiv2.InstancetypeKubermatic
}

func (p *standardPreferenceWrapper) Spec() kvinstancetypev1alpha1.VirtualMachinePreferenceSpec {
	return p.VirtualMachinePreference.Spec
}

type preferenceListWrapper struct {
	items []preferenceWrapper
}

// toApi converts to apiv2 types.
func (l *preferenceListWrapper) toApi() (*apiv2.VirtualMachinePreferenceList, error) {
	res := &apiv2.VirtualMachinePreferenceList{}
	if len(l.items) > 0 {
		res.Preferences = make(map[apiv2.VirtualMachineInstancetypeCategory][]apiv2.VirtualMachinePreference)
		for _, it := range l.items {
			preference, err := newAPIPreference(it)
			if err != nil {
				return nil, err
			}
			res.Preferences[it.Category()] = append(res.Preferences[it.Category()], *preference)
		}
	}
	return res, nil
}

// KubeVirtImages returns supported KubeVirt images.
func KubeVirtImages(ctx context.Context, datacenterName string, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (*apiv2.KubeVirtImagesList, error) {
	res := &apiv2.KubeVirtImagesList{
		Standard: apiv2.KubeVirtImages{
			Source:           apiv2.KubeVirtImageHTTPSourceType,
			OperatingSystems: kubermaticv1.ImageListWithVersions{},
		},
	}

	for os := range kubermaticv1.SupportedKubeVirtOS {
		res.Standard.OperatingSystems[os] = map[string]string{}
	}

	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
	if err != nil {
		return nil, fmt.Errorf("error getting dc: %w", err)
	}

	if datacenter.Spec.Kubevirt == nil {
		return nil, fmt.Errorf("KubeVirt datacenter spec is empty")
	}

	httpSource := datacenter.Spec.Kubevirt.Images.HTTP
	if httpSource != nil {
		for os, versions := range httpSource.OperatingSystems {
			// Ensure the sub-map for the operating system is initialized
			if _, ok := res.Standard.OperatingSystems[os]; !ok {
				res.Standard.OperatingSystems[os] = map[string]string{}
			}
			for version, link := range versions {
				res.Standard.OperatingSystems[os][version] = link
			}
		}
	}

	return res, nil
}
