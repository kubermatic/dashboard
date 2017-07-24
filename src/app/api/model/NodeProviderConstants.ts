/**
 * Created by maaz1de on 23.01.2017.
 */
export class NodeProvider {
  public static readonly AWS: string = "aws";
  public static readonly DIGITALOCEAN: string = "digitalocean";
  public static readonly BRINGYOUROWN: string = "bringyourown";
  public static readonly BAREMETAL: string = "baremetal";
  public static readonly OPENSTACK: string = "openstack";
}

export class NodeInstanceFlavors {
  public static readonly AWS: string[] = ["t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "m4.large",
    "m4.xlarge", "m4.2xlarge", "m4.4xlarge", "m4.10xlarge", "m4.16xlarge",
    "m3.medium", "m3.large", "m3.xlarge", "m3.2xlarge"];
  public static readonly OPENSTACK: any =
    [
      {"key": "s1.medium", "name":"1 vCPUs | 4 GB"},
      {"key": "s1.large", "name":"2 vCPUs | 8 GB"},
      {"key": "s1.xlarge", "name":"4 vCPUs | 16 GB"},
      {"key": "s1.2xlarge", "name":"8 vCPUs | 32 GB"},
      {"key": "s1.4xlarge", "name":"16 vCPUs | 64 GB"},
      {"key": "s1.8xlarge", "name":"32 vCPUs | 128 GB"}
    ];

  public static readonly VOID: string[] = [];
}
