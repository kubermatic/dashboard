import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatTooltipModule} from '@angular/material';
import {AWSNodeDataComponent} from './aws-node-data/aws-node-data.component';
import {AzureNodeDataComponent} from './azure-node-data/azure-node-data.component';
import {DigitaloceanNodeDataComponent} from './digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanOptionsComponent} from './digitalocean-node-data/digitalocean-options/digitalocean-options.component';
import {HetznerNodeDataComponent} from './hetzner-node-data/hetzner-node-data.component';
import {NodeDataComponent} from './node-data.component';
import {OpenstackNodeDataComponent} from './openstack-node-data/openstack-node-data.component';
import {OpenstackOptionsComponent} from './openstack-node-data/openstack-options/openstack-options.component';
import {VSphereNodeDataComponent} from './vsphere-add-node/vsphere-node-data.component';
import {VSphereOptionsComponent} from './vsphere-add-node/vsphere-options/vsphere-options.component';

@NgModule({
  imports: [
    CommonModule,
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
    NodeDataComponent,
    AWSNodeDataComponent,
    DigitaloceanNodeDataComponent,
    DigitaloceanOptionsComponent,
    OpenstackNodeDataComponent,
    OpenstackOptionsComponent,
    HetznerNodeDataComponent,
    VSphereNodeDataComponent,
    VSphereOptionsComponent,
    AzureNodeDataComponent,
  ],
  exports: [
    NodeDataComponent,
  ],
})
export class NodeDataModule {
}
