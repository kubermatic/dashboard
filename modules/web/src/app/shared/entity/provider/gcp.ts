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

export class GCPMachineSize {
  name: string;
  description: string;
  memory: number;
  vcpus: number;
  accelerators?: GCPMachineAccelerator[];
}

export class GCPMachineAccelerator {
  guestAcceleratorType: string;
  guestAcceleratorCount: number;
}

export class GCPDiskType {
  name: string;
  description: string;
}

export class GCPZone {
  name: string;
}

export class GCPNetwork {
  id: string;
  name: string;
  autoCreateSubnetworks: boolean;
  subnetworks: string[];
  kind: string;
  path: string;
}

export class GCPSubnetwork {
  id: string;
  name: string;
  network: string;
  ipCidrRange: string;
  ipFamily: string;
  gatewayAddress: string;
  region: string;
  selfLink: string;
  privateIpGoogleAccess: boolean;
  kind: string;
  path: string;
}

export class GCPImage {
  name: string;
  default?: boolean;
}
