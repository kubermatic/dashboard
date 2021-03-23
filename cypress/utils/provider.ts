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

export enum Provider {
  Anexia = 'anexia',
  AWS = 'aws',
  Azure = 'azure',
  BringYourOwn = 'bringyourown',
  Digitalocean = 'digitalocean',
  GCP = 'gcp',
  Hetzner = 'hetzner',
  OpenStack = 'openstack',
}

export namespace Datacenter {
  export enum Anexia {
    Vienna = 'Vienna',
  }

  export enum AWS {
    Frankfurt = 'Frankfurt',
  }

  export enum Azure {
    WestEurope = 'West europe',
  }

  export enum BringYourOwn {
    Frankfurt = 'Frankfurt',
  }

  export enum Digitalocean {
    Frankfurt = 'Frankfurt',
  }

  export enum GCP {
    Germany = 'Germany',
  }

  export enum Hetzner {
    Nuremberg = 'Nuremberg 1 DC 3',
  }

  export enum Openstack {
    Syseleven = 'dbl1',
  }
}
