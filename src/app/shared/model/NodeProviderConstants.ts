/**
 * Created by maaz1de on 23.01.2017.
 */
export class NodeProvider {
  public static readonly AWS: string = 'aws';
  public static readonly DIGITALOCEAN: string = 'digitalocean';
  public static readonly BRINGYOUROWN: string = 'bringyourown';
  public static readonly BAREMETAL: string = 'baremetal';
  public static readonly OPENSTACK: string = 'openstack';

  public static readonly Supported: string[] = [
    NodeProvider.AWS,
    NodeProvider.DIGITALOCEAN,
    NodeProvider.OPENSTACK,
    NodeProvider.BRINGYOUROWN
  ];
}

export namespace NodeInstanceFlavors {
  export const AWS: string[] = ['t2.nano', 't2.micro', 't2.small', 't2.medium', 't2.large', 'm4.large',
    'm4.xlarge', 'm4.2xlarge', 'm4.4xlarge', 'm4.10xlarge', 'm4.16xlarge',
    'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge'];
  export const Openstack: string[] = ['m1.micro', 'm1.tiny', 'm1.small', 'm1.medium', 'm1.large'];
  export const VOID: string[] = [];
}
