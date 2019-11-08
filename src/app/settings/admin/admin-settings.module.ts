import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

import {AdminSettingsComponent} from './admin-settings.component';
import {AdminSettingsRoutingModule} from './admin-settings.routing.module';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule],
  declarations: [AdminSettingsComponent],
})
export class AdminSettingsModule {
}
