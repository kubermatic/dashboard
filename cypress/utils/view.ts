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

enum Clusters {
  Default = 'clusters',
  External = 'clusters/external',
}

enum ClusterTemplates {
  Default = 'clustertemplates',
}

enum Projects {
  Default = 'projects',
}

enum AdminSettings {
  Default = 'settings',
  Administrators = 'settings/administrators',
  Interface = 'settings/interface',
  DefaultsAndLimits = 'settings/defaults',
  DynamicDatacenters = 'settings/datacenters',
  ProviderPresets = 'settings/presets',
  OPA = 'settings/opa',
}

enum Account {
  Default = 'account',
}

enum Members {
  Default = 'members',
}

enum ServiceAccounts {
  Default = 'serviceaccounts',
}

enum SSHKeys {
  Default = 'sshkeys',
}

enum Wizard {
  Default = 'wizard',
}

enum Login {
  Default = '/',
}

export class View {
  static readonly Login = Login;
  static readonly Clusters = Clusters;
  static readonly ClusterTemplates = ClusterTemplates;
  static readonly Projects = Projects;
  static readonly AdminSettings = AdminSettings;
  static readonly Account = Account;
  static readonly Members = Members;
  static readonly ServiceAccounts = ServiceAccounts;
  static readonly SSHKeys = SSHKeys;
  static readonly Wizard = Wizard;
}
