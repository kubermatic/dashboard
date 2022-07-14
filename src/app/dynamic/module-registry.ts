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

// This is the dynamic module registry file that will be used by default in enterprise edition builds.
// In the community edition builds it will be replaced by the module-registry.ce.ts file.
// The configuration can be found in the angular.json and package.json files.
// IMPORTANT: Keep in sync with module-registry.ce.ts file.

export namespace DynamicModule {
  export const Theming = import('./enterprise/theming/module').then(module => module.ThemingModule);
  export const AllowedRegistries = import('./enterprise/allowed-registries/module').then(
    module => module.AllowedRegistriesModule
  );
  export const Metering = import('./enterprise/metering/module').then(module => module.MeteringModule);
  export const Quotas = import('./enterprise/quotas/module').then(module => module.QuotasModule);
}
