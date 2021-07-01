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

export namespace Endpoint {
  export enum Digitalocean {
    Sizes = '**/providers/digitalocean/sizes',
  }

  export const Clusters = '**/clusters';
  export const MachineDeployments = '**/machinedeployments';
  export const Users = '**/users';
  export const Projects = '**/projects?displayAll=false';
  export const Tokens = '**/tokens';
  export const ServiceAccounts = '**/serviceaccounts';
  export const Settings = '**/me/settings';
  export const SSHKeys = '**/sshkeys';
  export const AdminSettings = '**/admin/settings';
  export const Administrators = '**/admin';
  export const ConstraintTemplates = '**/constrainttemplates';
  export const Constraints = '**/constraints';
  export const GatekeeperConfig = '**/gatekeeper/config';
}
