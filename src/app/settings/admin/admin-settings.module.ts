import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {AdminSettingsComponent} from './admin-settings.component';
import {AdminSettingsRoutingModule} from './admin-settings.routing.module';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule],
  declarations: [AdminSettingsComponent, AddAdminDialogComponent],
  entryComponents: [AddAdminDialogComponent],
})
export class AdminSettingsModule {
}
