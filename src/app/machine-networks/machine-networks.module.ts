import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MachineNetworksComponent } from './machine-networks.component';

@NgModule({
  imports: [
    SharedModule,
  ],
  declarations: [
    MachineNetworksComponent,
  ],
  exports: [
    MachineNetworksComponent,
  ],
})
export class MachineNetworksModule {
}
