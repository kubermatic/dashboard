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

export class Project {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  status: string;
  labels?: object;
  owners: ProjectOwners[];
  clustersNumber?: number;
}

export class ProjectOwners {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  email: string;
  id?: string;
  name: string;
  projects?: OwnerProjects[];
}

export class OwnerProjects {
  group: string;
  id: string;
}

export class ProjectModel {
  name: string;
  labels?: object;
}
