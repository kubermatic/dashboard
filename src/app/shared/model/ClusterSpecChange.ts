import { AWSCloudSpec } from '../entity/cloud/AWSCloudSpec';
import { DigitaloceanCloudSpec } from '../entity/cloud/DigitaloceanCloudSpec';
import { HetznerCloudSpec } from '../entity/cloud/HetznerCloudSpec';
import { OpenstackCloudSpec } from '../entity/cloud/OpenstackCloudSpec';
import { VSphereCloudSpec } from '../entity/cloud/VSphereCloudSpec';
import { AzureCloudSpec } from '../entity/cloud/AzureCloudSpec';

export class ClusterProviderSettingsData {
  aws?: AWSCloudSpec;
  digitalocean?: DigitaloceanCloudSpec;
  hetzner?: HetznerCloudSpec;
  openstack?: OpenstackCloudSpec;
  vsphere?: VSphereCloudSpec;
  azure?: AzureCloudSpec;
  valid: boolean;
}
