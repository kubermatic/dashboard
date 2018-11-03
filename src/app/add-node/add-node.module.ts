import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule } from '@angular/material';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { AzureAddNodeComponent } from './azure-add-node/azure-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from './digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { HetznerAddNodeComponent } from './hetzner-add-node/hetzner-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { OpenstackOptionsComponent } from './openstack-add-node/openstack-options/openstack-options.component';
import { VSphereAddNodeComponent } from './vsphere-add-node/vsphere-add-node.component';
import { VSphereOptionsComponent } from './vsphere-add-node/vsphere-options/vsphere-options.component';

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
  ],
  declarations: [
    AddNodeComponent,
    AwsAddNodeComponent,
    DigitaloceanAddNodeComponent,
    DigitaloceanOptionsComponent,
    OpenstackAddNodeComponent,
    OpenstackOptionsComponent,
    HetznerAddNodeComponent,
    VSphereAddNodeComponent,
    VSphereOptionsComponent,
    AzureAddNodeComponent,
  ],
  exports: [
    AddNodeComponent,
  ],
})
export class AddNodeModule {
}
