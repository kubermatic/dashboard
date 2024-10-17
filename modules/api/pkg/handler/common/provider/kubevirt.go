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
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	projectID, clusterID, datacenterName string, settingsProvider provider.SettingsProvider) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, err
	}

	return KubeVirtInstancetypes(ctx, kvKubeconfig, datacenterName, cluster, settingsProvider, userInfoGetter, seedsGetter)
}

func KubeVirtPreferencesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string, settingsProvider provider.SettingsProvider) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return nil, err
	}

	return KubeVirtPreferences(ctx, kvKubeconfig, cluster, settingsProvider)
}

func KubeVirtStorageClasses(ctx context.Context, kubeconfig string) (apiv2.StorageClassList, error) {
	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	return kubevirt.ListStorageClasses(ctx, client, nil)
}

func KubeVirtStorageClassesWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return KubeVirtStorageClasses(ctx, kvKubeconfig)
}

func KubeVirtVPCsWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	return KubeVirtVPCs(ctx, kvKubeconfig)
}

func KubeVirtSubnetsWithClusterCredentialsEndpoint(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider,
	projectID, clusterID string) (interface{}, error) {
	kvKubeconfig, err := getKvKubeConfigFromCredentials(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID)
	if err != nil {
		return nil, err
	}

	cluster, err := handlercommon.GetCluster(ctx, projectProvider, privilegedProjectProvider, userInfoGetter, projectID, clusterID, &provider.ClusterGetOptions{CheckInitStatus: true})
	if err != nil {
		return "", err
	}

	if cluster.Spec.Cloud.Kubevirt == nil {
		return "", utilerrors.NewNotFound("cloud spec for ", clusterID)
	}

	return KubeVirtVPCSubnets(ctx, kvKubeconfig, cluster.Spec.Cloud.Kubevirt.VPCName)
}

// kubeVirtInstancetypes returns the kvinstancetypev1alpha1.VirtualMachineInstanceType:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests.
func kubeVirtInstancetypes(ctx context.Context, client ctrlruntimeclient.Client, kubeconfig string) (instancetypeListWrapper, error) {
	instancetypes := instancetypeListWrapper{}
	customInstancetypes := kvinstancetypev1alpha1.VirtualMachineClusterInstancetypeList{}
	standardInstancetypes := kvinstancetypev1alpha1.VirtualMachineInstancetypeList{}
	// "custom" (cluster-wide)
	if err := client.List(ctx, &customInstancetypes); err != nil {
		return instancetypes, err
	}
	// "standard" (namespaced)
	standardInstancetypes.Items = kubevirt.GetKubermaticStandardInstancetypes(client, &kvmanifests.StandardInstancetypeGetter{})

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
func KubeVirtInstancetypes(ctx context.Context, kubeconfig string, datacenterName string, cluster *kubermaticv1.Cluster, settingsProvider provider.SettingsProvider, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (*apiv2.VirtualMachineInstancetypeList, error) {
	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	instancetypes, err := kubeVirtInstancetypes(ctx, client, kubeconfig)
	if err != nil {
		return nil, err
	}

	// conversion to api type
	res, err := instancetypes.toApi()
	if err != nil {
		return nil, err
	}

	// Reconcile Kubermatic Standard (update flow)
	for _, it := range instancetypes.items {
		if it.Category() == apiv2.InstancetypeKubermatic {
			if cluster != nil {
				instancetypeReconcilers := []reconciling.NamedVirtualMachineInstancetypeReconcilerFactory{
					instancetypeReconciler(it),
				}
				if err := reconciling.ReconcileVirtualMachineInstancetypes(ctx, instancetypeReconcilers, cluster.Status.NamespaceName, client); err != nil {
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
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		_, datacenter, err := provider.DatacenterFromSeedMap(userInfo, seedsGetter, datacenterName)
		if err != nil {
			return nil, fmt.Errorf("error getting dc: %w", err)
		}
		filter = handlercommon.DetermineMachineFlavorFilter(datacenter.Spec.MachineFlavorFilter, settings.Spec.MachineDeploymentVMResourceQuota)
	}

	return filterInstancetypes(res, filter), nil
}

// kubeVirtPreferences returns the kvinstancetypev1alpha1.VirtualMachinePreference:
// - custom (cluster-wide)
// - concatenated with kubermatic standard from yaml manifests.
func kubeVirtPreferences(ctx context.Context, client ctrlruntimeclient.Client, kubeconfig string) (preferenceListWrapper, error) {
	preferences := preferenceListWrapper{}
	customPreferences := kvinstancetypev1alpha1.VirtualMachineClusterPreferenceList{}
	standardPreferences := kvinstancetypev1alpha1.VirtualMachinePreferenceList{}
	// "custom" (cluster-wide)
	if err := client.List(ctx, &customPreferences); err != nil {
		return preferences, err
	}
	// "standard" (namespaced)
	standardPreferences.Items = kubevirt.GetKubermaticStandardPreferences(client, &kvmanifests.StandardPreferenceGetter{})

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
func KubeVirtPreferences(ctx context.Context, kubeconfig string, cluster *kubermaticv1.Cluster, settingsProvider provider.SettingsProvider) (*apiv2.VirtualMachinePreferenceList, error) {
	client, err := NewKubeVirtClient(kubeconfig, kubevirt.ClientOptions{})
	if err != nil {
		return nil, err
	}

	preferences, err := kubeVirtPreferences(ctx, client, kubeconfig)
	if err != nil {
		return nil, err
	}

	// conversion to api type
	res, err := preferences.toApi()
	if err != nil {
		return nil, err
	}

	// Reconcile Kubermatic Standard (update flow)
	for _, it := range preferences.items {
		if it.Category() == apiv2.InstancetypeKubermatic {
			if cluster != nil {
				preferenceReconcilers := []reconciling.NamedVirtualMachinePreferenceReconcilerFactory{
					preferenceReconciler(it),
				}
				if err := reconciling.ReconcileVirtualMachinePreferences(ctx, preferenceReconcilers, cluster.Status.NamespaceName, client); err != nil {
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
			for version, link := range versions {
				res.Standard.OperatingSystems[os][version] = link
			}
		}
	}

	return res, nil
}
