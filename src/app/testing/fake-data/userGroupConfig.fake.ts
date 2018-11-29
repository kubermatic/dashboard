import {UserGroupConfig} from '../../shared/model/Config';

export function fakeUserGroupConfig(): UserGroupConfig {
  return {
    owners: {
      projects: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      members: {
        view: true,
        edit: true,
        remove: true,
        invite: true,
      },
      sshKeys: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      clusters: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      nodes: {
        view: true,
        create: true,
        delete: true,
      },
    },
    editors: {
      projects: {
        view: true,
        edit: true,
        create: true,
        delete: false,
      },
      members: {
        view: false,
        edit: false,
        remove: false,
        invite: false,
      },
      sshKeys: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      clusters: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      nodes: {
        view: true,
        create: true,
        delete: true,
      },
    },
    viewers: {
      projects: {
        view: true,
        edit: false,
        create: true,
        delete: false,
      },
      members: {
        view: false,
        edit: false,
        remove: false,
        invite: false,
      },
      sshKeys: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      clusters: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      nodes: {
        view: true,
        create: true,
        delete: true,
      },
    },
  };
}
