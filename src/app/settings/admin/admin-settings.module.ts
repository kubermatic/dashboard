import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

import {AdminSettingsComponent} from './admin-settings.component';
import {AdminSettingsRoutingModule} from './admin-settings.routing.module';
import {CustomLinksFormComponent} from './custom-link-form/custom-links-form.component';
import {AddAdminDialogComponent} from './admins/add-admin-dialog/add-admin-dialog.component';
import {AdminsComponent} from './admins/admins.component';
import {DynamicDatacentersComponent} from './dynamic-datacenters/dynamic-datacenters.component';
import {DatacenterDataDialogComponent} from './dynamic-datacenters/datacenter-data-dialog/datacenter-data-dialog.component';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule],
  declarations: [
    AdminSettingsComponent,
    AddAdminDialogComponent,
    CustomLinksFormComponent,
    DatacenterDataDialogComponent,
    DynamicDatacentersComponent,
    AdminsComponent,
  ],
  entryComponents: [AddAdminDialogComponent, DatacenterDataDialogComponent],
})
export class AdminSettingsModule {}
