import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {AdminSettingsComponent} from './admin-settings.component';
import {AdminSettingsRoutingModule} from './admin-settings.routing.module';
import {CustomLinksFormComponent} from './custom-link-form/custom-links-form.component';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule],
  declarations: [AdminSettingsComponent, AddAdminDialogComponent, CustomLinksFormComponent],
  entryComponents: [AddAdminDialogComponent],
})
export class AdminSettingsModule {}
