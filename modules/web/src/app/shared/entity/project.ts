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
import {AllowedOperatingSystems} from './settings';

export enum ProjectStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Terminating = 'Terminating',
}

export enum ProjectAnnotation {
  GrafanaOrgId = 'mla.k8c.io/organization',
}

export class Project {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  annotations: Record<ProjectAnnotation, string>;
  status: ProjectStatus;
  labels?: object;
  owners: ProjectOwner[];
  clustersNumber?: number;
  spec?: {
    allowedOperatingSystems?: AllowedOperatingSystems;
  };

  static getStatusIcon(project: Project): string {
    switch (project?.status) {
      case ProjectStatus.Active:
        return StatusIcon.Running;
      case ProjectStatus.Inactive:
        return StatusIcon.Disabled;
      case ProjectStatus.Terminating:
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
  spec?: {
    allowedOperatingSystems?: AllowedOperatingSystems;
  };
}
