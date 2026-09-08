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

import {AlibabaInstanceType} from '@shared/entity/provider/alibaba';
import {AnexiaNodeSpec} from '@shared/entity/node';
import {AWSSize} from '@shared/entity/provider/aws';
import {AzureSizes} from '@shared/entity/provider/azure';
import {Optimized, Standard} from '@shared/entity/provider/digitalocean';

import {GCPMachineSize} from '@shared/entity/provider/gcp';
import {Type} from '@shared/entity/provider/hetzner';
import {OpenstackFlavor} from '@shared/entity/provider/openstack';
import {KubeVirtNodeSize} from '@shared/entity/provider/kubevirt';

export class AcceleratorQuota {
  provider: string;
  resources: Record<string, string>;
}

export class QuotaVariables {
  cpu?: number;
  memory?: number;
  storage?: number;
  accelerators?: AcceleratorQuota[];
  // Request-only: set to true on update to activate accelerator accounting. Activation is
  // irreversible and requires the accelerator limits to be empty, so it is never sent together
  // with accelerators. Read the current state from QuotaDetails.acceleratorAccountingEnabled.
  enableAcceleratorAccounting?: boolean;
}

export enum AcceleratorAccountingPhase {
  Activating = 'Activating',
  Ready = 'Ready',
  Blocked = 'Blocked',
}

export class AcceleratorAccountingBlocker {
  type: string;
  message?: string;
  seedName?: string;
  clusterName?: string;
  count?: number;
}

export class ResourceQuotaGlobalAcceleratorAccountingStatus {
  activationPhase: AcceleratorAccountingPhase;
  observedAccountingRevision: string;
  observedQuotaDigest: string;
  observedAt?: string;
  legacyMachinesWithoutFootprint: number;
  machinesWithInvalidFootprint: number;
  ready: boolean;
  blockers?: AcceleratorAccountingBlocker[];
}

export class QuotaStatus {
  globalUsage: QuotaVariables | Record<string, never>;
  localUsage: QuotaVariables | Record<string, never>;
  globalAcceleratorAccounting?: ResourceQuotaGlobalAcceleratorAccountingStatus;
}

export class Quota {
  quota: QuotaVariables;
  subjectKind: string;
  subjectName: string;
}

export class QuotaDetails extends Quota {
  name: string;
  subjectHumanReadableName?: string;
  isDefault?: boolean;
  status: QuotaStatus;
  // Whether accelerator accounting has been activated. Activation is irreversible and is a
  // precondition for setting any accelerator limits.
  acceleratorAccountingEnabled?: boolean;
}

export class ResourceQuotaCalculation {
  resourceQuota: ResourceQuota;
  calculatedQuota: QuotaVariables;
  message: string;
}

export class ResourceQuota {
  name: string;
  subjectName: string;
  subjectKind: string;
  subjectHumanReadableName?: string;
  isDefault: boolean;
  quota: QuotaVariables;
  status: QuotaStatus;
}

export class ResourceQuotaCalculationPayload {
  replicas: number;
  diskSizeGB?: number;
  replacedResources?: ResourceQuotaCalculationPayload;
  alibabaInstanceType?: AlibabaInstanceType;
  anexiaNodeSpec?: AnexiaNodeSpec;
  awsSize?: AWSSize;
  azureSize?: AzureSizes;
  doSize?: Standard | Optimized;

  gcpSize?: GCPMachineSize;
  hetznerSize?: Type;
  kubevirtNodeSize?: KubeVirtNodeSize;
  nutanixNodeSpec?: any;
  openstackSize?: OpenstackFlavor;
  vmDirectorNodeSpec?: any;
  vSphereNodeSpec?: any;
  edgeNodeSpec?: any;
}
