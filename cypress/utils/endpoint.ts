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
  export enum Alibaba {
    InstanceTypes = '**/api/**/alibaba/instancetypes',
    VSwitches = '**/api/**/alibaba/vswitches',
    Zones = '**/api/**/alibaba/zones',
  }

  export enum Anexia {
    Templates = '**/api/**/anexia/templates',
    VLANs = '**/api/**/anexia/vlans',
  }

  export enum AWS {
    Sizes = '**/api/**/aws/sizes',
    Subnets = '**/api/**/aws/*/subnets',
  }

  export enum Azure {
    Sizes = '**/api/**/azure/sizes',
  }

  export enum Digitalocean {
    Sizes = '**/providers/digitalocean/sizes',
  }

  export enum GCP {
    DiskTypes = '**/api/**/gcp/disktypes',
    Sizes = '**/api/**/gcp/sizes',
    Zones = '**/api/**/gcp/*/zones',
  }

  export enum Equinix {
    Sizes = '**/api/**/packet/sizes',
  }

  export enum Hetzner {
    Sizes = '**/api/**/hetzner/sizes',
  }

  export enum OpenStack {
    AvailabilityZones = '**/api/**/openstack/availabilityzones',
    Sizes = '**/api/**/openstack/sizes',
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
}
