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

import {AuditLoggingSettings, CloudSpec, ClusterType} from '../entity/cluster';
import {Datacenter} from '../entity/datacenter';
import {NodeProvider} from './NodeProviderConstants';

export class ClusterSpecForm {
  name: string;
  type: ClusterType;
  labels: object;
  version: string;
  imagePullSecret?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  admissionPlugins?: string[];
  podNodeSelectorAdmissionPluginConfig?: object;
  auditLogging?: AuditLoggingSettings;
  valid: boolean;
}

export class SetMachineNetworksForm {
  setMachineNetworks: boolean;
  machineNetworks: MachineNetworkForm[];
  valid: boolean;
}

export class MachineNetworkForm {
  cidr: string;
  dnsServers: string[];
  gateway: string;
  valid: boolean;
}

export class ClusterProviderForm {
  provider: NodeProvider;
  valid: boolean;
}

export class ClusterDatacenterForm {
  datacenter?: Datacenter;
  valid: boolean;
}

export class ClusterProviderSettingsForm {
  cloudSpec?: CloudSpec;
  valid: boolean;
}

export class ClusterSettingsFormView {
  hideOptional: boolean;
}
