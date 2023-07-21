// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

export enum VMwareCloudDirectorIPAllocationMode {
  POOL = 'POOL',
  DHCP = 'DHCP',
}

export class VMwareCloudDirectorNetwork {
  name: string;
}

export class VMwareCloudDirectorStorageProfile {
  name: string;
}

export class VMwareCloudDirectorCatalog {
  name: string;
}

export class VMwareCloudDirectorTemplate {
  name: string;
}

export class VMwareCloudDirectorComputePolicy {
  name: string;
  id: string;
  description: string;
  isSizingOnly: boolean;
}
