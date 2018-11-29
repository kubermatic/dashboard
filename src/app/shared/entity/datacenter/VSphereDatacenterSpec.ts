import {DatacenterOperatingSystemOptions} from '../DatacenterEntity';

export class VSphereDatacenterSpec {
  datastore: string;
  endpoint: string;
  cluster: string;
  datacenter: string;
  templates: DatacenterOperatingSystemOptions;
}
