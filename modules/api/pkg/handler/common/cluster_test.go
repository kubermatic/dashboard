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

package common

import (
	"context"
	"reflect"
	"testing"

	"github.com/stretchr/testify/require"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/sdk/v2/semver"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/metrics/pkg/apis/metrics/v1beta1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	ctrlruntimefake "sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func TestExternalCCMMigration(t *testing.T) {
	const (
		kubernetesVersionToTest = "1.21.0"
	)

	t.Parallel()
	testCases := []struct {
		Name           string
		Datacenter     *kubermaticv1.Datacenter
		Cluster        *kubermaticv1.Cluster
		ExpectedStatus apiv1.ExternalCCMMigrationStatus
	}{
		{
			Name: "scenario 1: CCM migration not needed since the beginning",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.OpenstackCloudProvider),
						Openstack:    &kubermaticv1.OpenstackCloudSpec{},
					},
					Features: map[string]bool{
						kubermaticv1.ClusterFeatureExternalCloudProvider: true,
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationNotNeeded,
		},
		{
			Name: "scenario 2: CCM migration not needed because cluster has already migrated",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						kubermaticv1.CCMMigrationNeededAnnotation: "",
						kubermaticv1.CSIMigrationNeededAnnotation: "",
					},
				},
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.OpenstackCloudProvider),
						Openstack:    &kubermaticv1.OpenstackCloudSpec{},
					},
					Features: map[string]bool{
						kubermaticv1.ClusterFeatureExternalCloudProvider: true,
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
					Conditions: map[kubermaticv1.ClusterConditionType]kubermaticv1.ClusterCondition{
						kubermaticv1.ClusterConditionCSIKubeletMigrationCompleted: {
							Status: corev1.ConditionTrue,
						},
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationNotNeeded,
		},
		{
			Name: "scenario 3: CCM migration supported",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.OpenstackCloudProvider),
						Openstack:    &kubermaticv1.OpenstackCloudSpec{},
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationSupported,
		},
		{
			Name: "scenario 4: CCM migration unsupported",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.FakeCloudProvider),
						Fake:         &kubermaticv1.FakeCloudSpec{},
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationUnsupported,
		},
		{
			Name: "scenario 5: external CCM migration in progress, cluster condition existing",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						kubermaticv1.CCMMigrationNeededAnnotation: "",
						kubermaticv1.CSIMigrationNeededAnnotation: "",
					},
				},
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.OpenstackCloudProvider),
						Openstack:    &kubermaticv1.OpenstackCloudSpec{},
					},
					Features: map[string]bool{
						kubermaticv1.ClusterFeatureExternalCloudProvider: true,
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
					Conditions: map[kubermaticv1.ClusterConditionType]kubermaticv1.ClusterCondition{
						kubermaticv1.ClusterConditionCSIKubeletMigrationCompleted: {
							Status: corev1.ConditionFalse,
						},
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationInProgress,
		},
		{
			Name: "scenario 6: external CCM migration in progress, cluster condition not existing",
			Datacenter: &kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{Openstack: &kubermaticv1.DatacenterSpecOpenstack{}},
			},
			Cluster: &kubermaticv1.Cluster{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						kubermaticv1.CCMMigrationNeededAnnotation: "",
						kubermaticv1.CSIMigrationNeededAnnotation: "",
					},
				},
				Spec: kubermaticv1.ClusterSpec{
					Cloud: kubermaticv1.CloudSpec{
						ProviderName: string(kubermaticv1.OpenstackCloudProvider),
						Openstack:    &kubermaticv1.OpenstackCloudSpec{},
					},
					Features: map[string]bool{
						kubermaticv1.ClusterFeatureExternalCloudProvider: true,
					},
					Version: *semver.NewSemverOrDie(kubernetesVersionToTest),
				},
				Status: kubermaticv1.ClusterStatus{
					Versions: kubermaticv1.ClusterVersionsStatus{
						ControlPlane: *semver.NewSemverOrDie(kubernetesVersionToTest),
					},
				},
			},
			ExpectedStatus: apiv1.ExternalCCMMigrationInProgress,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			ccmStatus := convertInternalCCMStatusToExternal(tc.Cluster, tc.Datacenter)
			if !reflect.DeepEqual(ccmStatus, tc.ExpectedStatus) {
				t.Fatalf("Received status %v, expected status: %v", ccmStatus, tc.ExpectedStatus)
			}
		})
	}
}

func TestGetMetricsEndpointBYOCNIUnavailableReturnsEmptyMetrics(t *testing.T) {
	t.Parallel()

	scheme := runtime.NewScheme()
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(v1beta1.AddToScheme(scheme))

	cluster := &kubermaticv1.Cluster{
		ObjectMeta: metav1.ObjectMeta{Name: "cluster-1"},
		Spec: kubermaticv1.ClusterSpec{
			CNIPlugin: &kubermaticv1.CNIPluginSettings{Type: kubermaticv1.CNIPluginTypeNone},
		},
	}

	project := &kubermaticv1.Project{ObjectMeta: metav1.ObjectMeta{Name: "project-1"}}
	node := &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "node-1"}}

	baseClient := ctrlruntimefake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(node).
		Build()

	seedClient := ctrlruntimefake.NewClientBuilder().
		WithScheme(scheme).
		Build()

	clusterProvider := &fakeClusterProvider{
		adminClient: &fakeFailingNodeMetricsClient{
			Client: baseClient,
			err:    apierrors.NewServiceUnavailable("the server is currently unable to handle the request"),
		},
	}

	ctx := context.WithValue(t.Context(), middleware.ClusterProviderContextKey, clusterProvider)
	ctx = context.WithValue(ctx, middleware.PrivilegedClusterProviderContextKey, &fakePrivilegedClusterProvider{
		cluster:    cluster,
		seedClient: seedClient,
	})

	resp, err := GetMetricsEndpoint(
		ctx,
		adminUserInfoGetter,
		project.Name,
		cluster.Name,
		&fakeProjectProvider{},
		&fakePrivilegedProjectProvider{project: project},
	)
	require.NoError(t, err)

	metrics, ok := resp.(*apiv1.ClusterMetrics)
	require.Truef(t, ok, "expected *apiv1.ClusterMetrics, got %T", resp)
	require.Equal(t, cluster.Name, metrics.Name, "returned metrics name should equal cluster name")
}

type fakeFailingNodeMetricsClient struct {
	ctrlruntimeclient.Client
	err error
}

func (c *fakeFailingNodeMetricsClient) List(ctx context.Context, list ctrlruntimeclient.ObjectList, opts ...ctrlruntimeclient.ListOption) error {
	if _, ok := list.(*v1beta1.NodeMetricsList); ok {
		return c.err
	}

	return c.Client.List(ctx, list, opts...)
}

type fakeClusterProvider struct {
	provider.ClusterProvider
	adminClient ctrlruntimeclient.Client
}

func (p *fakeClusterProvider) GetAdminClientForUserCluster(_ context.Context, _ *kubermaticv1.Cluster) (ctrlruntimeclient.Client, error) {
	return p.adminClient, nil
}

type fakePrivilegedClusterProvider struct {
	provider.PrivilegedClusterProvider
	cluster    *kubermaticv1.Cluster
	seedClient ctrlruntimeclient.Client
}

func (p *fakePrivilegedClusterProvider) GetUnsecured(_ context.Context, _ *kubermaticv1.Project, _ string, _ *provider.ClusterGetOptions) (*kubermaticv1.Cluster, error) {
	return p.cluster, nil
}

func (p *fakePrivilegedClusterProvider) GetSeedClusterAdminRuntimeClient() ctrlruntimeclient.Client {
	return p.seedClient
}

type fakeProjectProvider struct {
	provider.ProjectProvider
}

type fakePrivilegedProjectProvider struct {
	provider.PrivilegedProjectProvider
	project *kubermaticv1.Project
}

func (p *fakePrivilegedProjectProvider) GetUnsecured(_ context.Context, _ string, _ *provider.ProjectGetOptions) (*kubermaticv1.Project, error) {
	return p.project, nil
}

func adminUserInfoGetter(_ context.Context, _ string) (*provider.UserInfo, error) {
	return &provider.UserInfo{
		IsAdmin: true,
		Email:   "admin@example.com",
		Groups:  []string{"admins"},
	}, nil
}
