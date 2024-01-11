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

// IMPORTANT: Keep in sync with module-registry.ts file.

export namespace DynamicModule {
  export const Theming = import('./community/theming/module').then(module => module.ThemingModule);
  export const AllowedRegistries = import('./community/allowed-registries/module').then(
    module => module.AllowedRegistriesModule
  );
  export const Metering = import('./community/metering/module').then(module => module.MeteringModule);
  export const Quotas = import('./community/quotas/module').then(module => module.QuotasModule);
  export const Group = import('./community/group/module').then(module => module.GroupModule);
  export const ClusterBackups = import('./community/cluster-backups/module').then(module => module.ClusterBackupsModule)
  export const isEnterpriseEdition = false;
}
