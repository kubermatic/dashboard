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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatLegacyAutocompleteModule as MatAutocompleteModule} from '@angular/material/legacy-autocomplete';
import {MatLegacyCardModule as MatCardModule} from '@angular/material/legacy-card';
import {MatLegacyCheckboxModule as MatCheckboxModule} from '@angular/material/legacy-checkbox';
import {MatLegacyOptionModule as MatOptionModule} from '@angular/material/legacy-core';
import {MatLegacyFormFieldModule as MatFormFieldModule} from '@angular/material/legacy-form-field';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {MatLegacySelectModule as MatSelectModule} from '@angular/material/legacy-select';
import {MatLegacyTooltipModule as MatTooltipModule} from '@angular/material/legacy-tooltip';
import {AnexiaBasicNodeDataComponent} from '@app/node-data/basic/provider/anexia/component';
import {VSphereTagsComponent} from '@app/node-data/extended/provider/vsphere/tag-categories/component';
import {NodeDataService} from '@core/services/node-data/service';
import {SharedModule} from '@shared/module';
import {AlibabaBasicNodeDataComponent} from './basic/provider/alibaba/component';
import {AWSBasicNodeDataComponent} from './basic/provider/aws/component';
import {AzureBasicNodeDataComponent} from './basic/provider/azure/component';
import {BasicNodeDataComponent} from './basic/provider/component';
import {DigitalOceanBasicNodeDataComponent} from './basic/provider/digitalocean/component';
import {GCPBasicNodeDataComponent} from './basic/provider/gcp/component';
import {HetznerBasicNodeDataComponent} from './basic/provider/hetzner/component';
import {KubeVirtBasicNodeDataComponent} from './basic/provider/kubevirt/component';
import {TopologySpreadConstraintFormComponent} from './basic/provider/kubevirt/topology-spread-contraint-form/component';
import {OpenstackBasicNodeDataComponent} from './basic/provider/openstack/component';
import {EquinixBasicNodeDataComponent} from './basic/provider/equinix/component';
import {VSphereBasicNodeDataComponent} from './basic/provider/vsphere/component';
import {NodeDataComponent} from './component';
import {NodeDataDialogComponent} from './dialog/component';
import {ExtendedNodeDataComponent} from './extended/component';
import {AlibabaExtendedNodeDataComponent} from './extended/provider/alibaba/component';
import {AWSExtendedNodeDataComponent} from './extended/provider/aws/component';
import {AzureExtendedNodeDataComponent} from './extended/provider/azure/component';
import {VSphereExtendedNodeDataComponent} from './extended/provider/vsphere/component';
import {DigitalOceanExtendedNodeDataComponent} from './extended/provider/digitalocean/component';
import {GCPExtendedNodeDataComponent} from './extended/provider/gcp/component';
import {OpenstackExtendedNodeDataComponent} from './extended/provider/openstack/component';
import {EquinixExtendedNodeDataComponent} from './extended/provider/equinix/component';
import {KubeletVersionNodeDataComponent} from './kubelet-version/component';
import {NutanixBasicNodeDataComponent} from '@app/node-data/basic/provider/nutanix/component';
import {InstanceDetailsDialogComponent} from '@app/node-data/basic/provider/kubevirt/instance-details/component';
import {VMwareCloudDirectorBasicNodeDataComponent} from '@app/node-data/basic/provider/vmware-cloud-director/component';
import {Routes, RouterModule} from '@angular/router';

const components = [
  AlibabaBasicNodeDataComponent,
  AlibabaExtendedNodeDataComponent,
  AWSBasicNodeDataComponent,
  AWSExtendedNodeDataComponent,
  DigitalOceanBasicNodeDataComponent,
  DigitalOceanExtendedNodeDataComponent,
  VSphereBasicNodeDataComponent,
  KubeVirtBasicNodeDataComponent,
  HetznerBasicNodeDataComponent,
  EquinixBasicNodeDataComponent,
  EquinixExtendedNodeDataComponent,
  AzureBasicNodeDataComponent,
  AzureExtendedNodeDataComponent,
  VSphereExtendedNodeDataComponent,
  GCPBasicNodeDataComponent,
  GCPExtendedNodeDataComponent,
  OpenstackBasicNodeDataComponent,
  OpenstackExtendedNodeDataComponent,
  AnexiaBasicNodeDataComponent,
  NodeDataComponent,
  BasicNodeDataComponent,
  ExtendedNodeDataComponent,
  KubeletVersionNodeDataComponent,
  NodeDataDialogComponent,
  NutanixBasicNodeDataComponent,
  InstanceDetailsDialogComponent,
  VMwareCloudDirectorBasicNodeDataComponent,
  TopologySpreadConstraintFormComponent,
  VSphereTagsComponent,
];

// component NodeDataComponent is added to routing module so we can use our dynamic component here
const routes: Routes = [
  {
    path: '',
    component: NodeDataComponent,
  },
];

const services = [NodeDataService];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatAutocompleteModule,
    MatTooltipModule,
    RouterModule.forChild(routes),
  ],
  declarations: [...components],
  providers: [...services],
  exports: [...components],
})
export class NodeDataModule {}
