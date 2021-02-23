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

export enum ChangelogCategory {
  ActionRequired = 'action-required',
  API = 'api',
  Interface = 'interface',
  Infrastructure = 'infrastructure',
  MachineController = 'machine-controller',
}

export interface ChangelogEntryLink {
  url: URL;
  caption: string;
}

export interface ChangelogEntry {
  category: ChangelogCategory;
  description: string;
  links?: ChangelogEntryLink[];
}

export interface Changelog {
  entries: ChangelogEntry[];
}

namespace Changelog {}
