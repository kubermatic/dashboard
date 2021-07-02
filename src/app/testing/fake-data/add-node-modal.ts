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

import {OpenstackFlavor, OpenstackAvailabilityZone} from '@shared/entity/provider/openstack';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';
import {AzureSizes} from '@shared/entity/provider/azure';
import {HetznerTypes} from '@shared/entity/provider/hetzner';
import {PacketSize} from '@shared/entity/provider/packet';

export function fakeDigitaloceanSizes(): DigitaloceanSizes {
  return {
    standard: [
      {
        available: true,
        disk: 20,
        memory: 2,
        vcpus: 2,
        price_hourly: 2,
        price_monthly: 2,
        regions: ['sfo'],
        slug: 'test1',
        transfer: 1,
      },
    ],
    optimized: [],
  };
}

export function fakeOpenstackFlavors(): OpenstackFlavor[] {
  return [
    {
      vcpus: 1,
      disk: 50,
      isPublic: true,
      memory: 1024,
      region: 'os1',
      slug: 'tiny-m1',
      swap: 0,
    },
  ];
}

export function fakeOpenstackAvailabilityZones(): OpenstackAvailabilityZone[] {
  return [
    {
      name: 'zone_1',
    },
    {
      name: 'zone_2',
    },
  ];
}

export function fakeAzureSizes(): AzureSizes[] {
  return [
    {
      name: 'Standard_A0',
      maxDataDiskCount: 1,
      memoryInMB: 768,
      numberOfCores: 1,
      numberOfGPUs: 1,
      osDiskSizeInMB: 1047552,
      resourceDiskSizeInMB: 20480,
    },
  ];
}

export function fakeHetznerTypes(): HetznerTypes {
  return {
    standard: [{id: 1, name: 'cx11', description: 'CX11', cores: 1, memory: 2, disk: 20}],
    dedicated: [],
  };
}

export function fakePacketSizes(): PacketSize[] {
  return [
    {
      name: 'x1.small.x86',
      memory: '32GB',
      cpus: [],
      drives: [],
    },
  ];
}
