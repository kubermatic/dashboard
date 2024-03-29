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
import {SharedModule} from '@shared/module';
import {ProjectOverviewComponent} from './component';
import {ProjectOverviewRoutingModule} from './routing';
import {MembersOverviewComponent} from '@app/project-overview/members-overview/component';
import {ClustersOverviewComponent} from '@app/project-overview/clusters-overview/component';
import {ProvidersOverviewComponent} from '@app/project-overview/providers-overview/component';
import {CreateResourcePanelComponent} from '@app/project-overview/create-resource-panel/component';

@NgModule({
  imports: [SharedModule, ProjectOverviewRoutingModule],
  declarations: [
    ProjectOverviewComponent,
    MembersOverviewComponent,
    ClustersOverviewComponent,
    ProvidersOverviewComponent,
    CreateResourcePanelComponent,
  ],
  exports: [ProjectOverviewComponent],
})
export class ProjectOverviewModule {}
