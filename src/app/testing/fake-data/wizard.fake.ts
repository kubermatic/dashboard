import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';

export const doNodeModelFake: CreateNodeModel = {
    instances: 3,
    spec: {
      cloud: {
        digitalocean: {
          size: '4gb',
          backups: null,
          ipv6: null,
          monitoring: null,
          tags: null
        },
        aws: null,
        openstack: null
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false
        },
        containerLinux: null
      },
      versions: {
        kubelet: null,
        containerRuntime: {
          name: null,
          version: null
        }
      }
    }
};

export const doClusterModelFake: CreateClusterModel = {
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
        masterVersion: '',
        seedDatacenterName: ''
    },
    sshKeys: [
        'key1'
    ]
};


