import {DatacenterOperatingSystemOptions} from '../DatacenterEntity';

export class OpenStackDatacenterSpec {
  availability_zone: string;
  auth_url: string;
  region: string;
  images: DatacenterOperatingSystemOptions;
  enforce_floating_ip: boolean;
}

export class OpenShiftDatacenterSpec {
  availability_zone: string;
  auth_url: string;
  region: string;
  images: DatacenterOperatingSystemOptions;
}
