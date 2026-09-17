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

import {
  KubeVirtInstanceType,
  KubeVirtInstanceTypeCategory,
  KubeVirtInstanceTypeKind,
  KubeVirtNodeInstanceType,
  KubeVirtNodePreference,
  KubeVirtPreferenceKind,
} from './kubevirt';

describe('KubeVirtInstanceType', () => {
  it('should allow kind to be optional', () => {
    const instanceType = new KubeVirtInstanceType();
    instanceType.name = 'standard-2';
    instanceType.spec = '{}';
    expect(instanceType.kind).toBeUndefined();

    instanceType.kind = KubeVirtInstanceTypeKind.VirtualMachineInstancetype;
    expect(instanceType.kind).toBe(KubeVirtInstanceTypeKind.VirtualMachineInstancetype);
  });
});

describe('KubeVirtInstanceType.getFormattedMemory', () => {
  it('should format the units the API returns', () => {
    expect(KubeVirtInstanceType.getFormattedMemory('8Gi')).toBe('8 GB');
    expect(KubeVirtInstanceType.getFormattedMemory('16Gi')).toBe('16 GB');
    expect(KubeVirtInstanceType.getFormattedMemory('32Gi')).toBe('32 GB');
    expect(KubeVirtInstanceType.getFormattedMemory('4194304Ki')).toBe('4 GB');
  });

  it('should not round sub-gigabyte instance types', () => {
    expect(KubeVirtInstanceType.getFormattedMemory('512Mi')).toBe('0.5 GB');
    expect(KubeVirtInstanceType.getFormattedMemory('1536Mi')).toBe('1.5 GB');
  });

  it('should fall back to the raw value when it cannot be parsed', () => {
    // The API used to rescale instance type memory to decimal SI; nothing should be shown as a
    // gigabyte count unless it carries a unit this can actually convert.
    expect(KubeVirtInstanceType.getFormattedMemory('8590M')).toBe('8590M');
    expect(KubeVirtInstanceType.getFormattedMemory('unknown')).toBe('unknown');
    expect(KubeVirtInstanceType.getFormattedMemory('')).toBe('');
  });
});

describe('KubeVirtNodeInstanceType.getCategory', () => {
  it('should return Kubermatic for VirtualMachineInstancetype', () => {
    const instanceType = new KubeVirtNodeInstanceType();
    instanceType.kind = KubeVirtInstanceTypeKind.VirtualMachineInstancetype;
    expect(KubeVirtNodeInstanceType.getCategory(instanceType)).toBe(KubeVirtInstanceTypeCategory.Kubermatic);
  });

  it('should return Custom for VirtualMachineClusterInstancetype', () => {
    const instanceType = new KubeVirtNodeInstanceType();
    instanceType.kind = KubeVirtInstanceTypeKind.VirtualMachineClusterInstancetype;
    expect(KubeVirtNodeInstanceType.getCategory(instanceType)).toBe(KubeVirtInstanceTypeCategory.Custom);
  });
});

describe('KubeVirtNodePreference.getCategory', () => {
  it('should return Kubermatic for VirtualMachinePreference', () => {
    const pref = new KubeVirtNodePreference();
    pref.kind = KubeVirtPreferenceKind.VirtualMachinePreference;
    expect(KubeVirtNodePreference.getCategory(pref)).toBe(KubeVirtInstanceTypeCategory.Kubermatic);
  });

  it('should return Custom for VirtualMachineClusterPreference', () => {
    const pref = new KubeVirtNodePreference();
    pref.kind = KubeVirtPreferenceKind.VirtualMachineClusterPreference;
    expect(KubeVirtNodePreference.getCategory(pref)).toBe(KubeVirtInstanceTypeCategory.Custom);
  });
});
