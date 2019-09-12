import {CloudSpec} from '../entity/ClusterEntity';
import {DataCenterEntity} from '../entity/DatacenterEntity';
import {NodeProvider} from './NodeProviderConstants';

export class ClusterSpecForm {
  name: string;
  type: string;
  version: string;
  imagePullSecret?: string;
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
  datacenter?: DataCenterEntity;
  valid: boolean;
}

export class ClusterProviderSettingsForm {
  cloudSpec?: CloudSpec;
  valid: boolean;
}

export class ClusterSettingsFormView {
  hideOptional: boolean;
}
