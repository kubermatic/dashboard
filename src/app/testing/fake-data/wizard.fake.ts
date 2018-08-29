import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { OpenstackTenant } from '../../shared/entity/provider/openstack/OpenstackSizeEntity';

export function doClusterModelFake(): CreateClusterModel {
  return {
    cluster: {
      cloud: {
        dc: 'do-fra1',
        digitalocean: {
          token: 'token'
        },
        bringyourown: null,
        aws: null,
        openstack: null,
        baremetal: null
      },
      humanReadableName: 'wizardly-pike',
      version: '',
      pause: false,
    },
    sshKeys: [
      'key1'
    ]
  };
}

export function openstackTenantsFake(): OpenstackTenant[] {
  return [
    {
      id: 'id123',
      name: 'loodse-poc'
    },
    {
      id: 'id456',
      name: 'loodse-poc2'
    }
  ];
}
