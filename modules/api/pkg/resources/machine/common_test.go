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

package machine

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	anexia "k8c.io/machine-controller/pkg/cloudprovider/provider/anexia"
	anexiatypes "k8c.io/machine-controller/pkg/cloudprovider/provider/anexia/types"
	providerconfigtypes "k8c.io/machine-controller/pkg/providerconfig/types"

	"k8s.io/utils/ptr"
)

func TestGetAnexiaProviderSpec(t *testing.T) {
	const (
		vlanID     = "vlan-identifier"
		templateID = "template-identifier"
		locationID = "location-identifier"
	)

	tests := []struct {
		name           string
		anexiaNodeSpec apiv1.AnexiaNodeSpec
		wantRawConf    *anexiatypes.RawConfig
		wantErr        error
	}{
		{
			name: "Anexia node spec with DiskSize attribute migrates to Disks",
			anexiaNodeSpec: apiv1.AnexiaNodeSpec{
				VlanID:     vlanID,
				TemplateID: templateID,
				CPUs:       4,
				Memory:     4096,
				DiskSize:   ptr.To[int64](80),
			},
			wantRawConf: &anexiatypes.RawConfig{
				VlanID:     providerconfigtypes.ConfigVarString{Value: vlanID},
				TemplateID: providerconfigtypes.ConfigVarString{Value: templateID},
				LocationID: providerconfigtypes.ConfigVarString{Value: locationID},
				CPUs:       4,
				Memory:     4096,
				Disks: []anexiatypes.RawDisk{
					{Size: 80},
				},
			},
			wantErr: nil,
		},
		{
			name: "Anexia node spec with Disks attribute",
			anexiaNodeSpec: apiv1.AnexiaNodeSpec{
				VlanID:     vlanID,
				TemplateID: templateID,
				CPUs:       4,
				Memory:     4096,
				Disks: []apiv1.AnexiaDiskConfig{
					{
						Size:            80,
						PerformanceType: ptr.To("ENT2"),
					},
				},
			},
			wantRawConf: &anexiatypes.RawConfig{
				VlanID:     providerconfigtypes.ConfigVarString{Value: vlanID},
				TemplateID: providerconfigtypes.ConfigVarString{Value: templateID},
				LocationID: providerconfigtypes.ConfigVarString{Value: locationID},
				CPUs:       4,
				Memory:     4096,
				DiskSize:   0,
				Disks: []anexiatypes.RawDisk{
					{
						Size:            80,
						PerformanceType: providerconfigtypes.ConfigVarString{Value: "ENT2"},
					},
				},
			},
			wantErr: nil,
		},
		{
			name: "Anexia node spec with both DiskSize and Disks attributes",
			anexiaNodeSpec: apiv1.AnexiaNodeSpec{
				VlanID:     vlanID,
				TemplateID: templateID,
				CPUs:       4,
				Memory:     4096,
				DiskSize:   ptr.To[int64](80),
				Disks: []apiv1.AnexiaDiskConfig{
					{
						Size:            80,
						PerformanceType: ptr.To("ENT2"),
					},
				},
			},
			wantRawConf: nil,
			wantErr:     anexia.ErrConfigDiskSizeAndDisks,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			dc := kubermaticv1.Datacenter{
				Spec: kubermaticv1.DatacenterSpec{
					Anexia: &kubermaticv1.DatacenterSpecAnexia{
						LocationID: locationID,
					},
				},
			}

			nodeSpec := apiv1.NodeSpec{
				Cloud: apiv1.NodeCloudSpec{
					Anexia: &test.anexiaNodeSpec,
				},
			}

			result, err := getAnexiaProviderSpec(nodeSpec, &dc)

			if test.wantErr != nil {
				assert.Nil(t, result, "expected an error, not a result")
				assert.ErrorIs(t, err, test.wantErr, "expected an error, not a result")
			} else {
				assert.NotNil(t, result)

				resultRawConfig := anexiatypes.RawConfig{}
				err := json.Unmarshal(result.Raw, &resultRawConfig)
				assert.Nil(t, err)

				assert.Equal(t, resultRawConfig.VlanID.Value, vlanID, "VLAN should be set correctly")
				assert.Equal(t, resultRawConfig.TemplateID.Value, templateID, "Template should be set correctly")
				assert.Equal(t, resultRawConfig.LocationID.Value, locationID, "Location should be set correctly")

				assert.EqualValues(t, resultRawConfig.CPUs, test.anexiaNodeSpec.CPUs, "CPUs should be set correctly")
				assert.EqualValues(t, resultRawConfig.Memory, test.anexiaNodeSpec.Memory, "Memory should be set correctly")

				if test.anexiaNodeSpec.DiskSize != nil {
					assert.Len(t, resultRawConfig.Disks, 1, "Disks attribute should have correct length")
					assert.EqualValues(t, resultRawConfig.Disks[0].Size, *test.anexiaNodeSpec.DiskSize, "Disk entry should have correct size")
					assert.Empty(t, resultRawConfig.Disks[0].PerformanceType, "Disk entry should have no performance type")
					assert.EqualValues(t, resultRawConfig.DiskSize, 0, "DiskSize should be set to 0")
				} else {
					assert.EqualValues(t, resultRawConfig.DiskSize, 0, "DiskSize should be set to 0")
					assert.Len(t, resultRawConfig.Disks, len(test.anexiaNodeSpec.Disks), "Disks attribute should have correct length")

					for i, dc := range test.anexiaNodeSpec.Disks {
						assert.EqualValues(t, resultRawConfig.Disks[i].Size, dc.Size, "Disk entry should have correct size")

						if dc.PerformanceType != nil {
							assert.EqualValues(t, resultRawConfig.Disks[i].PerformanceType.Value, *dc.PerformanceType, "Disk entry should have correct performance type")
						} else {
							assert.Empty(t, resultRawConfig.Disks[i].PerformanceType.Value, "Disk entry should have no performance type")
						}
					}
				}
			}
		})
	}
}
