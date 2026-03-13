// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';

export function getDefaultForOS(os: OperatingSystem, options: DatacenterOperatingSystemOptions): string {
  if (!options) {
    return '';
  }

  switch (os) {
    case OperatingSystem.Ubuntu:
      return options.ubuntu || '';
    case OperatingSystem.RHEL:
      return options.rhel || '';
    case OperatingSystem.Flatcar:
      return options.flatcar || '';
    case OperatingSystem.RockyLinux:
      return options.rockylinux || '';
    default:
      return '';
  }
}
