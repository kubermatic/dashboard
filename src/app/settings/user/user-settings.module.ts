import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

import {UserSettingsComponent} from './user-settings.component';
import {UserSettingsRoutingModule} from './user-settings.routing.module';

@NgModule({
  imports: [SharedModule, UserSettingsRoutingModule],
  declarations: [UserSettingsComponent],
})
export class UserSettingsModule {
}
