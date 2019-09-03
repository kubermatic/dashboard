import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatTooltipModule} from '@angular/material';

import {SharedModule} from '../shared/shared.module';
import {NodeDataComponent} from './component';
import {AWSNodeDataComponent} from './provider/aws/component';

const dynamicComponents = [
  AWSNodeDataComponent,
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
    NodeDataComponent,
    ...dynamicComponents,
  ],
  entryComponents: dynamicComponents,
  exports: [],
})
export class NodeDataModule {
}
