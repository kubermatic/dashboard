// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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
import {ApplicationsStepComponent} from '@app/wizard/step/applications/component';
import {CiliumApplicationValuesDialogComponent} from '@app/wizard/step/cluster/cilium-application-values-dialog/component';
import {BaremetalProviderBasicComponent} from '@app/wizard/step/provider-settings/provider/basic/baremetal/component';
import {OpenstackProviderExtendedCredentialsComponent} from '@app/wizard/step/provider-settings/provider/extended/openstack/default/component';
import {OpenstackCredentialsTypeService} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../node-data/config';
import {NodeDataModule} from '../node-data/module';
import {WizardComponent} from './component';
import {Routing} from './routing';
import {ClusterStepComponent} from './step/cluster/component';
import {ClusterSSHKeysComponent} from './step/cluster/ssh-keys/component';
import {MachineNetworkStepComponent} from './step/network/component';
import {NodeSettingsStepComponent} from './step/node-settings/component';
import {ProviderStepComponent} from './step/provider-datacenter/component';
import {ProviderSettingsStepComponent} from './step/provider-settings/component';
import {PresetsComponent} from './step/provider-settings/preset/component';
import {AlibabaProviderBasicComponent} from './step/provider-settings/provider/basic/alibaba/component';
import {AnexiaProviderBasicComponent} from './step/provider-settings/provider/basic/anexia/component';
import {AWSProviderBasicComponent} from './step/provider-settings/provider/basic/aws/component';
import {AzureProviderBasicComponent} from './step/provider-settings/provider/basic/azure/component';
import {ProviderBasicComponent} from './step/provider-settings/provider/basic/component';
import {DigitalOceanProviderBasicComponent} from './step/provider-settings/provider/basic/digitalocean/component';
import {GCPProviderBasicComponent} from './step/provider-settings/provider/basic/gcp/component';
import {HetznerProviderBasicComponent} from './step/provider-settings/provider/basic/hetzner/component';
import {KubeVirtProviderBasicComponent} from './step/provider-settings/provider/basic/kubevirt/component';
import {OpenstackProviderBasicComponent} from './step/provider-settings/provider/basic/openstack/component';
import {EquinixProviderBasicComponent} from './step/provider-settings/provider/basic/equinix/component';
import {VSphereProviderBasicComponent} from './step/provider-settings/provider/basic/vsphere/component';
import {AWSProviderExtendedComponent} from './step/provider-settings/provider/extended/aws/component';
import {AzureProviderExtendedComponent} from './step/provider-settings/provider/extended/azure/component';
import {ProviderExtendedComponent} from './step/provider-settings/provider/extended/component';
import {GCPProviderExtendedComponent} from './step/provider-settings/provider/extended/gcp/component';
import {HetznerProviderExtendedComponent} from './step/provider-settings/provider/extended/hetzner/component';
import {OpenstackProviderExtendedComponent} from './step/provider-settings/provider/extended/openstack/component';
import {VSphereProviderExtendedComponent} from './step/provider-settings/provider/extended/vsphere/component';
import {SummaryStepComponent} from './step/summary/component';
import {NutanixProviderBasicComponent} from '@app/wizard/step/provider-settings/provider/basic/nutanix/component';
import {NutanixProviderExtendedComponent} from '@app/wizard/step/provider-settings/provider/extended/nutanix/component';
import {VMwareCloudDirectorProviderBasicComponent} from '@app/wizard/step/provider-settings/provider/basic/vmware-cloud-director/component';
import {VMwareCloudDirectorProviderExtendedComponent} from '@app/wizard/step/provider-settings/provider/extended/vmware-cloud-director/component';

const components = [
  WizardComponent,
  PresetsComponent,
  ClusterStepComponent,
  SummaryStepComponent,
  ProviderStepComponent,
  MachineNetworkStepComponent,
  ProviderSettingsStepComponent,
  ApplicationsStepComponent,
  ProviderBasicComponent,
  AlibabaProviderBasicComponent,
  AWSProviderBasicComponent,
  DigitalOceanProviderBasicComponent,
  HetznerProviderBasicComponent,
  HetznerProviderExtendedComponent,
  KubeVirtProviderBasicComponent,
  OpenstackProviderBasicComponent,
  OpenstackProviderExtendedComponent,
  OpenstackProviderExtendedCredentialsComponent,
  EquinixProviderBasicComponent,
  VSphereProviderBasicComponent,
  ProviderExtendedComponent,
  AWSProviderExtendedComponent,
  VSphereProviderExtendedComponent,
  AzureProviderBasicComponent,
  AzureProviderExtendedComponent,
  GCPProviderBasicComponent,
  GCPProviderExtendedComponent,
  AnexiaProviderBasicComponent,
  NodeSettingsStepComponent,
  ClusterSSHKeysComponent,
  NutanixProviderBasicComponent,
  NutanixProviderExtendedComponent,
  VMwareCloudDirectorProviderBasicComponent,
  VMwareCloudDirectorProviderExtendedComponent,
  CiliumApplicationValuesDialogComponent,
  BaremetalProviderBasicComponent,
];

@NgModule({
  imports: [SharedModule, Routing, NodeDataModule],
  declarations: [...components],
  providers: [
    {
      provide: NODE_DATA_CONFIG,
      useValue: {mode: NodeDataMode.Wizard} as NodeDataConfig,
    },
    WizardService,
    OpenstackCredentialsTypeService,
  ],
  exports: [...components],
})
export class WizardModule {}
