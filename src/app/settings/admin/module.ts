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
import {PresetListComponent} from '@app/settings/admin/presets/component';
import {CreatePresetDialogComponent} from '@app/settings/admin/presets/create-dialog/component';
import {PresetStepComponent} from '@app/settings/admin/presets/create-dialog/steps/preset/component';
import {PresetProviderStepComponent} from '@app/settings/admin/presets/create-dialog/steps/provider/component';
import {PresetSettingsStepComponent} from '@app/settings/admin/presets/create-dialog/steps/settings/component';
import {WizardModule} from '@app/wizard/module';
import {SharedModule} from '@shared/shared.module';
import {AddAdminDialogComponent} from './admins/add-admin-dialog/component';
import {AdminsComponent} from './admins/component';
import {AdminSettingsComponent} from './component';
import {CustomLinksFormComponent} from './custom-link-form/component';
import {DynamicDatacentersComponent} from './dynamic-datacenters/component';
import {DatacenterDataDialogComponent} from './dynamic-datacenters/datacenter-data-dialog/component';
import {AdminSettingsRoutingModule} from './routing';

@NgModule({
  imports: [SharedModule, AdminSettingsRoutingModule, WizardModule],
  declarations: [
    AdminSettingsComponent,
    AddAdminDialogComponent,
    CustomLinksFormComponent,
    DatacenterDataDialogComponent,
    DynamicDatacentersComponent,
    AdminsComponent,
    PresetListComponent,
    CreatePresetDialogComponent,
    PresetStepComponent,
    PresetProviderStepComponent,
    PresetSettingsStepComponent,
  ],
})
export class AdminSettingsModule {}
