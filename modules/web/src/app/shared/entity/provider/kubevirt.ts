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

import {OperatingSystem} from '@shared/model/NodeProviderConstants';

export class KubeVirtInstanceTypeList {
  instancetypes: Record<KubeVirtInstanceTypeCategory, KubeVirtInstanceType[]>;
}

export class KubeVirtInstanceType {
  _id?: string; // unique identifier for dropdown options
  name: string;
  spec: string;
}

export class KubeVirtPreferenceList {
  preferences: Record<KubeVirtInstanceTypeCategory, KubeVirtPreference[]>;
}

export class KubeVirtPreference {
  _id?: string; // unique identifier for dropdown options
  name: string;
  spec: string;
}

export class KubeVirtOSImageList {
  standard?: KubeVirtOSImage;
}

export class KubeVirtOSImage {
  source: string;
  operatingSystems: Record<OperatingSystem, Record<string, string>>;
}

export class KubeVirtNodeInstanceType {
  name: string;
  kind: KubeVirtInstanceTypeKind;
  revisionName?: string;

  static getCategory(instanceType: KubeVirtNodeInstanceType): KubeVirtInstanceTypeCategory {
    switch (instanceType.kind) {
      case KubeVirtInstanceTypeKind.VirtualMachineInstancetype:
        return KubeVirtInstanceTypeCategory.Kubermatic;
      case KubeVirtInstanceTypeKind.VirtualMachineClusterInstancetype:
        return KubeVirtInstanceTypeCategory.Custom;
      default:
        return instanceType.kind;
    }
  }
}

export class KubeVirtNodePreference {
  name: string;
  kind: KubeVirtPreferenceKind;
  revisionName?: string;

  static getCategory(preference: KubeVirtNodePreference): KubeVirtInstanceTypeCategory {
    switch (preference.kind) {
      case KubeVirtPreferenceKind.VirtualMachinePreference:
        return KubeVirtInstanceTypeCategory.Kubermatic;
      case KubeVirtPreferenceKind.VirtualMachineClusterPreference:
        return KubeVirtInstanceTypeCategory.Custom;
      default:
        return preference.kind;
    }
  }
}

export class KubeVirtNodeSize {
  cpus: string;
  memory: string;
  primaryDiskSize: string;
}

export class KubeVirtStorageClass {
  name: string;
}

export class KubeVirtVPC {
  name: string;
}

export class KubeVirtSubnet {
  name: string;
}

export class KubeVirtTopologySpreadConstraint {
  maxSkew: number;
  topologyKey: string;
  whenUnsatisfiable: KubeVirtTopologyWhenUnsatisfiable;
}

export enum KubeVirtAffinityPreset {
  Hard = 'hard',
  Soft = 'soft',
}

export enum KubeVirtInstanceTypeCategory {
  Kubermatic = 'kubermatic',
  Custom = 'custom',
}

export enum KubeVirtInstanceTypeKind {
  VirtualMachineInstancetype = 'VirtualMachineInstancetype',
  VirtualMachineClusterInstancetype = 'VirtualMachineClusterInstancetype',
}

export enum KubeVirtPreferenceKind {
  VirtualMachinePreference = 'VirtualMachinePreference',
  VirtualMachineClusterPreference = 'VirtualMachineClusterPreference',
}

export enum KubeVirtTopologyWhenUnsatisfiable {
  ScheduleAnyway = 'ScheduleAnyway',
  DoNotSchedule = 'DoNotSchedule',
}
