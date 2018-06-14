import { CreateClusterModel } from '../../shared/model/CreateClusterModel';

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
    pause: false,
  },
  sshKeys: [
    'key1'
  ]
};
