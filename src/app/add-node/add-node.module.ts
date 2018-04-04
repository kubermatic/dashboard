import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatToolbarModule, MatTooltipModule } from '@angular/material';

const components: any[] = [
  AddNodeComponent,
  AwsAddNodeComponent,
  DigitaloceanAddNodeComponent,
  OpenstackAddNodeComponent,
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatCardModule,
    MatSortModule,
    MatSliderModule,
    MatSlideToggleModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    AddNodeComponent
  ]
})
export class AddNodeModule {
}
