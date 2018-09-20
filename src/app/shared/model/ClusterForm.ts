import { CloudSpec, ClusterEntity } from '../entity/ClusterEntity';
import { DataCenterEntity } from '../entity/DatacenterEntity';

export class ClusterFormData {
  cluster?: ClusterEntity;
  valid: boolean;
}

export class ClusterSpecForm {
  name: string;
  version: string;
  machineNetworks: MachineNetwork[];
  valid: boolean;
}

export class MachineNetwork {
  cidr: string;
  dnsServers: string[];
  gateway: string;
}

export class ClusterProviderForm {
  provider: string;
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
