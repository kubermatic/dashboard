// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
