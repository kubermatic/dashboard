// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';
import {AdminSettingsOPAComponent} from '@app/settings/admin/opa/component';
import {AdminSettingsOPARoutingModule} from '@app/settings/admin/opa/routing';
import {SharedModule} from '@shared/module';
import {ConstraintTemplatesComponent} from '@app/settings/admin/opa/constraint-templates/component';
import {ConstraintTemplateDialog} from '@app/settings/admin/opa/constraint-templates/constraint-template-dialog/component';
import {DefaultConstraintComponent} from '@app/settings/admin/opa/default-constraints/component';
import {DefaultConstraintDialog} from '@app/settings/admin/opa/default-constraints/default-constraint-dialog/component';

@NgModule({
  imports: [SharedModule, AdminSettingsOPARoutingModule],
  declarations: [
    AdminSettingsOPAComponent,
    ConstraintTemplatesComponent,
    ConstraintTemplateDialog,
    DefaultConstraintComponent,
    DefaultConstraintDialog,
  ],
})
export class AdminSettingsOPAModule {}
