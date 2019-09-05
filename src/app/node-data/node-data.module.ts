import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatTooltipModule} from '@angular/material';

import {SharedModule} from '../shared/shared.module';

import {AWSNodeDataComponent} from './aws-node-data/aws-node-data.component';
import {AWSNodeOptionsComponent} from './aws-node-data/aws-node-options/aws-node-options.component';
import {AzureNodeDataComponent} from './azure-node-data/azure-node-data.component';
import {AzureNodeOptionsComponent} from './azure-node-data/azure-node-options/azure-node-options.component';
import {DigitaloceanNodeDataComponent} from './digitalocean-node-data/digitalocean-node-data.component';

import {DigitaloceanNodeOptionsComponent} from './digitalocean-node-data/digitalocean-node-options/digitalocean-node-options.component';
import {GCPNodeDataComponent} from './gcp-node-data/gcp-node-data.component';
import {GCPNodeOptionsComponent} from './gcp-node-data/gcp-node-options/gcp-node-options.component';
import {HetznerNodeDataComponent} from './hetzner-node-data/hetzner-node-data.component';
import {KubeVirtNodeDataComponent} from './kubevirt-add-node/kubevirt-node-data.component';
import {NodeDataComponent} from './node-data.component';
import {OpenstackNodeDataComponent} from './openstack-node-data/openstack-node-data.component';

import {OpenstackNodeOptionsComponent} from './openstack-node-data/openstack-node-options/openstack-node-options.component';
import {PacketNodeDataComponent} from './packet-node-data/packet-node-data.component';
import {VSphereNodeDataComponent} from './vsphere-add-node/vsphere-node-data.component';

import {VSphereNodeOptionsComponent} from './vsphere-add-node/vsphere-node-options/vsphere-node-options.component';

const components: any[] = [
  NodeDataComponent,
  AWSNodeDataComponent,
  AWSNodeOptionsComponent,
  DigitaloceanNodeDataComponent,
  DigitaloceanNodeOptionsComponent,
  OpenstackNodeDataComponent,
  OpenstackNodeOptionsComponent,
  HetznerNodeDataComponent,
  VSphereNodeDataComponent,
  VSphereNodeOptionsComponent,
  AzureNodeDataComponent,
  AzureNodeOptionsComponent,
  PacketNodeDataComponent,
  GCPNodeDataComponent,
  GCPNodeOptionsComponent,
  KubeVirtNodeDataComponent,
];

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
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
})
export class NodeDataModule {
}
