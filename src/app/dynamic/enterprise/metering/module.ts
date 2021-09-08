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
import {RouterModule, Routes} from '@angular/router';
import {MeteringComponent} from '@app/dynamic/enterprise/metering/component';
import {MeteringConfigComponent} from '@app/dynamic/enterprise/metering/config/component';
import {MeteringConfigurationDialog} from '@app/dynamic/enterprise/metering/config/config-dialog/component';
import {MeteringCredentialsDialog} from '@app/dynamic/enterprise/metering/config/credentials-dialog/component';
import {MeteringListComponent} from '@app/dynamic/enterprise/metering/list/component';
import {SharedModule} from '@shared/module';

const routes: Routes = [{path: '', component: MeteringComponent}];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [
    MeteringComponent,
    MeteringListComponent,
    MeteringConfigComponent,
    MeteringConfigurationDialog,
    MeteringCredentialsDialog,
  ],
})
export class MeteringModule {}
