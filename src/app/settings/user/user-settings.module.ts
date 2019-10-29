import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';
import {SettingsStatusComponent} from '../status/settings-status.component';

import {UserSettingsComponent} from './user-settings.component';
import {UserSettingsRoutingModule} from './user-settings.routing.module';

@NgModule({
  imports: [SharedModule, UserSettingsRoutingModule],
  declarations: [UserSettingsComponent, SettingsStatusComponent],
})
export class UserSettingsModule {
}
