export class ClusterProviderSettingsData {
  aws?: AWSProviderSettings;
  digitalocean?: DigitaloceanProviderSettings;
  hetzner?: HetznerProviderSettings;
  openstack?: OpenstackProviderSettings;
  vsphere?: VSphereProviderSettings;
}

export class AWSProviderSettings {
  accessKeyId: string;
  secretAccessKey: string;
}

export class DigitaloceanProviderSettings {
  token: string;
}

export class HetznerProviderSettings {
  token: string;
}

export class OpenstackProviderSettings {
  password: string;
  username: string;
}

export class VSphereProviderSettings {
  password: string;
  username: string;
}
