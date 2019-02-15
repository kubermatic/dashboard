import {OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant} from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {CreateClusterModel} from '../../shared/model/CreateClusterModel';

export function doClusterModelFake(): CreateClusterModel {
  return {
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'do-fra1',
        digitalocean: {
          token: 'token',
        },
        bringyourown: null,
        aws: null,
        openstack: null,
        baremetal: null,
      },
      version: '',
    },
    sshKeys: [
      'key1',
    ],
  };
}

export function openstackTenantsFake(): OpenstackTenant[] {
  return [
    {
      id: 'id123',
      name: 'loodse-poc',
    },
    {
      id: 'id456',
      name: 'loodse-poc2',
    },
    {
      id: 'id789',
      name: 'another-loodse-poc',
    },
  ];
}

export function openstackNetworksFake(): OpenstackNetwork[] {
  return [
    {
      id: 'net123',
      name: 'test-network',
      external: false,
    },
    {
      id: 'net456',
      name: 'ext-net',
      external: false,
    },
    {
      id: 'net789',
      name: 'ext-net',
      external: true,
    },
  ];
}

export function openstackSortedNetworksFake(): OpenstackNetwork[] {
  return [
    {
      id: 'net456',
      name: 'ext-net',
      external: false,
    },
    {
      id: 'net123',
      name: 'test-network',
      external: false,
    },
  ];
}

export function openstackSortedFloatingIpsFake(): OpenstackNetwork[] {
  return [
    {
      id: 'net789',
      name: 'ext-net',
      external: true,
    },
  ];
}

export function openstackSecurityGroupsFake(): OpenstackSecurityGroup[] {
  return [
    {
      id: 'sg123',
      name: 'test-security-group',
    },
    {
      id: 'sg456',
      name: 'another-security-group',
    },
  ];
}

export function openstackSubnetIdsFake(): OpenstackSubnet[] {
  return [
    {
      id: 'sub123',
      name: 'test-subnet',
    },
    {
      id: 'sub456',
      name: 'another-subnet',
    },
  ];
}
