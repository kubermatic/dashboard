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

import {StatusIcon} from '@shared/utils/health-status';

export class Project {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  status: string;
  labels?: object;
  owners: ProjectOwner[];
  clustersNumber?: number;

  static isActive(project: Project): boolean {
    return project?.status === 'Active';
  }

  static getStatusIcon(project: Project): string {
    switch (project?.status) {
      case 'Active':
        return StatusIcon.Running;
      case 'Inactive':
        return StatusIcon.Disabled;
      case 'Terminating':
        return StatusIcon.Error;
      default:
        return '';
    }
  }
}

export class ProjectOwner {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  email: string;
  id?: string;
  name: string;
  projects?: OwnedProject[];
}

export class OwnedProject {
  group: string;
  id: string;
}

export class ProjectModel {
  name: string;
  labels?: object;
}
