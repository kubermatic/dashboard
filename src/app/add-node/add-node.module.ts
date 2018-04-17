import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HetznerAddNodeComponent } from './hetzner-add-node/hetzner-add-node.component';
import { MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatCheckboxModule } from '@angular/material';
import { VSphereAddNodeComponent } from './vsphere-add-node/vsphere-add-node.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule
  ],
  declarations: [
    AddNodeComponent,
    AwsAddNodeComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    HetznerAddNodeComponent,
    VSphereAddNodeComponent,
  ],
  exports: [
    AddNodeComponent
  ]
})
export class AddNodeModule {
}
