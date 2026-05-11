/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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
	"testing"

	"github.com/stretchr/testify/require"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	clusterv1alpha1 "k8c.io/machine-controller/sdk/apis/cluster/v1alpha1"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/metrics/pkg/apis/metrics/v1beta1"
	ctrlruntimefake "sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func TestListMachineDeploymentMetricsBYOCNIUnavailableReturnsEmptyList(t *testing.T) {
	t.Parallel()

	scheme := runtime.NewScheme()
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(v1beta1.AddToScheme(scheme))
	utilruntime.Must(clusterv1alpha1.AddToScheme(scheme))

	project := &kubermaticv1.Project{ObjectMeta: metav1.ObjectMeta{Name: "project-1"}}
	cluster := &kubermaticv1.Cluster{
		ObjectMeta: metav1.ObjectMeta{Name: "cluster-1"},
		Spec: kubermaticv1.ClusterSpec{
			CNIPlugin: &kubermaticv1.CNIPluginSettings{Type: kubermaticv1.CNIPluginTypeNone},
		},
	}

	md := &clusterv1alpha1.MachineDeployment{
		ObjectMeta: metav1.ObjectMeta{Name: "md-1", Namespace: metav1.NamespaceSystem},
		Spec: clusterv1alpha1.MachineDeploymentSpec{
			Template: clusterv1alpha1.MachineTemplateSpec{},
			Selector: metav1.LabelSelector{MatchLabels: map[string]string{"md-id": "md-1"}},
		},
	}
	machine := &clusterv1alpha1.Machine{
		ObjectMeta: metav1.ObjectMeta{Name: "node-1", Namespace: metav1.NamespaceSystem, Labels: map[string]string{"md-id": "md-1"}},
	}
	node := &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "node-1"}}

	baseClient := ctrlruntimefake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(md, machine, node).
		Build()

	clusterProvider := &fakeClusterProvider{
		adminClient: &fakeFailingNodeMetricsClient{
			Client: baseClient,
			err:    apierrors.NewServiceUnavailable("the server is currently unable to handle the request"),
		},
	}

	ctx := context.WithValue(context.Background(), middleware.ClusterProviderContextKey, clusterProvider)
	ctx = context.WithValue(ctx, middleware.PrivilegedClusterProviderContextKey, &fakePrivilegedClusterProvider{cluster: cluster})

	resp, err := ListMachineDeploymentMetrics(
		ctx,
		adminUserInfoGetter,
		&fakeProjectProvider{},
		&fakePrivilegedProjectProvider{project: project},
		project.Name,
		cluster.Name,
		md.Name,
	)
	require.NoError(t, err)

	metrics, ok := resp.([]apiv1.NodeMetric)
	require.Truef(t, ok, "expected []apiv1.NodeMetric, got %T", resp)
	require.Equal(t, 0, len(metrics), "expected empty metrics list")
}
