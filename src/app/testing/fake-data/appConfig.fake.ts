import {Config} from '../../shared/model/Config';

export function fakeAppConfig(): Config {
  return {
    share_kubeconfig: false,
    openstack: {
      wizard_use_default_user: false,
    },
  };
}
