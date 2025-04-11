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

export class Addon {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec?: AddonSpec;
}

export class AddonSpec {
  isDefault?: boolean;
  variables?: object;
  continuouslyReconcile?: boolean;
}

export class AddonConfig {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: AddonConfigSpec;
}

export class AddonConfigSpec {
  shortDescription: string;
  description: string;
  logo: string;
  logoFormat: string;
  formSpec: AddonFormSpec[];
}

export class AddonFormSpec {
  displayName: string;
  internalName: string;
  helpText: string;
  required: boolean;
  type: string;
}

export function getAddonVariable(addon: Addon, internalName: string): any {
  if (!addon || !addon.spec || !addon.spec.variables) {
    return undefined;
  }

  return addon.spec.variables[internalName];
}

export function hasAddonFormData(addonConfig: AddonConfig) {
  return !!addonConfig && !!addonConfig.spec && !!addonConfig.spec.formSpec;
}

export function hasAddonLogoData(addonConfig: AddonConfig): boolean {
  return !!addonConfig && !!addonConfig.spec && !!addonConfig.spec.logo && !!addonConfig.spec.logoFormat;
}

export function getAddonLogoData(addonConfig: AddonConfig): string {
  return addonConfig && addonConfig.spec
    ? `data:image/${addonConfig.spec.logoFormat};base64,${addonConfig.spec.logo}`
    : '';
}

export function getAddonShortDescription(addonConfig: AddonConfig): string {
  return addonConfig && addonConfig.spec ? addonConfig.spec.shortDescription : '';
}
