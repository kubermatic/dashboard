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

import {Injectable} from '@angular/core';
import {GuidedTourItem} from './entity';
import {GuidedTourID} from './utils';

@Injectable()
export class GuidedTourItemsService {
  getGuidedTourItems(): GuidedTourItem[] {
    return [
      {
        id: GuidedTourID.StartTour,
        route: 'projects',
        title: 'Getting Started',
        text:
          'For the purposes of the guided tour we will pre-fill textboxes for you and show you sample content. No projects, clusters or nodes will be created. You can cancel or revisit the tour at any time.',
        stepPosition: 'center',
      },
      {
        id: GuidedTourID.AddProjectBtn,
        route: 'projects',
        title: 'Get started by adding a project',
        text: 'A project groups your clusters together for ease of management.',
        stepPosition: 'bottom',
      },
      {
        id: GuidedTourID.AddProjectDialog,
        route: 'projects',
        title: 'Your first project',
        text:
          'Select a name to describe your project. Add labels you want to be inherited to every cluster and node inside the project or leave them blank. These settings can be edited later.',
        stepPosition: 'right',
      },
      {
        id: GuidedTourID.ProjectItem,
        route: 'projects',
        title: 'Project created',
        text: 'Click on the project. We will start creating clusters shortly.',
        stepPosition: 'right',
      },
    ];
  }
}
