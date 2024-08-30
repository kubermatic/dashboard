// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';
import {AdminSidenavComponent} from '@app/settings/admin/nav/component';
import {PresetDialogComponent} from '@app/settings/admin/presets/dialog/component';
import {PresetStepComponent} from '@app/settings/admin/presets/dialog/steps/preset/component';
import {PresetProviderStepComponent} from '@app/settings/admin/presets/dialog/steps/provider/component';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {PresetSettingsStepComponent} from '@app/settings/admin/presets/dialog/steps/settings/component';
import {AKSSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/aks/component';
import {AlibabaSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/alibaba/component';
import {AnexiaSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/anexia/component';
import {AWSSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/aws/component';
import {AzureSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/azure/component';
import {BaremetalSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/baremetal/component';
import {DigitaloceanSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/digitalocean/component';
import {EKSSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/eks/component';
import {EquinixSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/equinix/component';
import {GCPSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/gcp/component';
import {GKESettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/gke/component';
import {HetznerSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/hetzner/component';
import {KubevirtSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/kubevirt/component';
import {NutanixSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/nutanix/component';
import {OpenstackSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/openstack/component';
import {VMwareCloudDirectorSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/vmware-cloud-director/component';
import {VSphereSettingsComponent} from '@app/settings/admin/presets/dialog/steps/settings/provider/vsphere/component';
import {EditPresetDialogComponent} from '@app/settings/admin/presets/edit-dialog/component';
import {SharedModule} from '@shared/module';
import {AdminSettingsComponent} from './component';
import {DatacenterDataDialogComponent} from './dynamic-datacenters/datacenter-data-dialog/component';
import {AdminSettingsRoutingModule} from './routing';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule],
  declarations: [
    AdminSidenavComponent,
    AdminSettingsComponent,
    DatacenterDataDialogComponent,
    PresetDialogComponent,
    EditPresetDialogComponent,
    PresetStepComponent,
    PresetProviderStepComponent,
    PresetSettingsStepComponent,
    AKSSettingsComponent,
    AlibabaSettingsComponent,
    AnexiaSettingsComponent,
    AWSSettingsComponent,
    AzureSettingsComponent,
    DigitaloceanSettingsComponent,
    EKSSettingsComponent,
    GCPSettingsComponent,
    GKESettingsComponent,
    HetznerSettingsComponent,
    KubevirtSettingsComponent,
    OpenstackSettingsComponent,
    EquinixSettingsComponent,
    VSphereSettingsComponent,
    NutanixSettingsComponent,
    VMwareCloudDirectorSettingsComponent,
    BaremetalSettingsComponent,
  ],
  providers: [PresetDialogService],
})
export class AdminSettingsModule {}
