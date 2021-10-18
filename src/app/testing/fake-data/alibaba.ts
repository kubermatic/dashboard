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

import {AlibabaInstanceType, AlibabaZone, AlibabaVSwitch} from '@shared/entity/provider/alibaba';

export function fakeAlibabaInstanceTypes(): AlibabaInstanceType[] {
  return [
    {id: 'ecs.c5.large', cpuCoreCount: 2, gpuCoreCount: 0, memorySize: 4},
    {id: 'ecs.c5.xlarge', cpuCoreCount: 4, gpuCoreCount: 2, memorySize: 8},
    {id: 'ecs.c5.2xlarge', cpuCoreCount: 8, gpuCoreCount: 0, memorySize: 16},
    {id: 'ecs.c5.4xlarge', cpuCoreCount: 16, gpuCoreCount: 1, memorySize: 32},
    {id: 'ecs.c5.6xlarge', cpuCoreCount: 24, gpuCoreCount: 0, memorySize: 48},
  ];
}

export function fakeAlibabaZones(): AlibabaZone[] {
  return [{id: 'eu-central-1a'}, {id: 'eu-central-1b'}];
}

export function fakeAlibabaVSwitches(): AlibabaVSwitch[] {
  return [{id: 'vsw-gw8g8mn4ohmj483hsylmn'}, {id: 'vsw-gw876svgsv52bk0c95krn'}];
}
