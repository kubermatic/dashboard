import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';

export const doNodeModelFake: CreateNodeModel = {
    instances: 3,
    spec: {
        digitalocean: {
            size: '4gb'
        },
        aws: null,
        openstack: null,
        baremetal: null
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
    },
    sshKeys: [
        'key1'
    ]
};


