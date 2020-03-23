import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';

import {SharedModule} from '../shared/shared.module';

import {AWSBasicNodeDataComponent} from './basic/provider/aws/component';
import {DigitalOceanBasicNodeDataComponent} from './basic/provider/digitalocean/component';
import {NodeDataComponent} from './component';
import {ExtendedNodeDataComponent} from './extended/component';
import {AWSExtendedNodeDataComponent} from './extended/provider/aws/component';
import {DigitalOceanExtendedNodeDataComponent} from './extended/provider/digitalocean/component';
import {NodeDataService} from './service/service';
import {KubeVirtBasicNodeDataComponent} from "./basic/provider/kubevirt/component";

const components = [
  AWSBasicNodeDataComponent,
  AWSExtendedNodeDataComponent,
  DigitalOceanBasicNodeDataComponent,
  DigitalOceanExtendedNodeDataComponent,
  KubeVirtBasicNodeDataComponent,
  NodeDataComponent,
  ExtendedNodeDataComponent,
];

const services = [
  NodeDataService,
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
  declarations: [...components],
  providers: [...services],
  exports: [...components],
})
export class NodeDataModule {
}
