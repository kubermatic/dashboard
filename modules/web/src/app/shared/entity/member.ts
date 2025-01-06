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

import {UserSettings} from './settings';

export class Member {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  email: string;
  groups?: string[];
  isAdmin?: boolean;
  id: string;
  name: string;
  userSettings?: UserSettings;
  projects: MemberProject[];
  lastSeen?: Date;
  readAnnouncements?: string[];
}

export class MemberProject {
  group: string;
  id: string;
}

export class MemberModel {
  email: string;
  projects: MemberProject[];
}

export class Admin {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}
