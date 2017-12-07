import { SharedModule } from 'app/shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { FormComponent } from './form/form.component';

const components: any[] = [
  AddNodeComponent, 
  AwsAddNodeComponent, 
  DigitaloceanAddNodeComponent, 
  OpenstackAddNodeComponent
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    ...components,
    FormComponent
  ],
  exports: [
    ...components
  ]
})
export class AddNodeModule { }
