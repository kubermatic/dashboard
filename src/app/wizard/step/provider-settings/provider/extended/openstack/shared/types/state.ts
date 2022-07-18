// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

export enum SecurityGroupState {
  Ready = 'Security Group',
  Loading = 'Loading...',
  Empty = 'No Security Groups Available',
}

export enum NetworkState {
  Ready = 'Network',
  Loading = 'Loading...',
  Empty = 'No Networks Available',
}

export enum IPv4SubnetIDState {
  Ready = 'IPv4 Subnet ID',
  Loading = 'Loading...',
  Empty = 'No IPv4 Subnet IDs Available',
}

export enum IPv6SubnetIDState {
  Ready = 'IPv6 Subnet ID',
  Loading = 'Loading...',
  Empty = 'No IPv6 Subnet IDs Available',
}

export enum IPv6SubnetPoolState {
  Ready = 'IPv6 Subnet Pool',
  Loading = 'Loading...',
  Empty = 'No IPv6 Subnet Pools Available',
}
