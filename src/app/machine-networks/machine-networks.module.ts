import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatCheckboxModule, MatCardModule, MatAutocompleteModule, MatButtonToggleModule, MatTabsModule } from '@angular/material';
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
