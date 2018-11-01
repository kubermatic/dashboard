import { OpenstackTenant } from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';

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
  ];
}
