import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatTabsModule } from '@angular/material';
import { SharedModule } from '../shared/shared.module';
import { MachineNetworksComponent } from './machine-networks.component';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatTabsModule
  ],
  declarations: [
    MachineNetworksComponent,
  ],
  exports: [
    MachineNetworksComponent
  ]
})
export class MachineNetworksModule {
}
