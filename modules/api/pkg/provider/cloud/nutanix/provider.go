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

package nutanix

import (
	"context"
	"errors"
	"fmt"
	"go.uber.org/zap"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"

	"k8s.io/utils/pointer"
)

const (
	ClusterCategoryName = "KKPCluster"
	ProjectCategoryName = "KKPProject"
	categoryDescription = "automatically created by KKP"
	categoryValuePrefix = "kubernetes-"

	DefaultProject = "default"

	categoryCleanupFinalizer = "kubermatic.k8c.io/cleanup-nutanix-categories"
)

type Nutanix struct {
	dc                *kubermaticv1.DatacenterSpecNutanix
	log               *zap.SugaredLogger
	secretKeySelector provider.SecretKeySelectorValueFunc
}

var _ provider.CloudProvider = &Nutanix{}

func NewCloudProvider(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc) (*Nutanix, error) {
	if dc.Spec.Nutanix == nil {
		return nil, errors.New("datacenter is not a Nutanix datacenter")
	}

	return &Nutanix{
		dc:                dc.Spec.Nutanix,
		log:               log.Logger,
		secretKeySelector: secretKeyGetter,
	}, nil
}

func (n *Nutanix) DefaultCloudSpec(_ context.Context, spec *kubermaticv1.CloudSpec) error {
	// default csi
	if spec.Nutanix.CSI != nil {
		if spec.Nutanix.CSI.Port == nil {
			spec.Nutanix.CSI.Port = pointer.Int32(9440)
		}
	}

	return nil
}

func (n *Nutanix) ValidateCloudSpec(ctx context.Context, spec kubermaticv1.CloudSpec) error {
	if spec.Nutanix == nil {
		return errors.New("not a Nutanix spec")
	}

	client, err := GetClientSet(n.dc, spec.Nutanix, n.secretKeySelector)
	if err != nil {
		return err
	}

	if spec.Nutanix.ProjectName != "" {
		// check for project existence
		_, err = GetProjectByName(ctx, client, spec.Nutanix.ProjectName)
		if err != nil {
			return err
		}
	}

	// validate csi is set - required for new clusters
	if spec.Nutanix.CSI == nil {
		return errors.New("CSI not configured")
	}

	return nil
}

func (n *Nutanix) ValidateCloudSpecUpdate(_ context.Context, oldSpec kubermaticv1.CloudSpec, newSpec kubermaticv1.CloudSpec) error {
	if oldSpec.Nutanix == nil || newSpec.Nutanix == nil {
		return errors.New("'nutanix' spec is empty")
	}

	if oldSpec.Nutanix.ClusterName != newSpec.Nutanix.ClusterName {
		return fmt.Errorf("updating Nutanix cluster name is not supported (was %s, updated to %s)", oldSpec.Nutanix.ClusterName, newSpec.Nutanix.ClusterName)
	}

	if oldSpec.Nutanix.ProjectName != newSpec.Nutanix.ProjectName {
		return fmt.Errorf("updating Nutanix project name is not supported (was %s, updated to %s)", oldSpec.Nutanix.ProjectName, newSpec.Nutanix.ProjectName)
	}

	return nil
}

func CategoryValue(clusterName string) string {
	return categoryValuePrefix + clusterName
}
