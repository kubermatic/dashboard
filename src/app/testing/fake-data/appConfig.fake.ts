import {Config} from '../../shared/model/Config';

export function fakeAppConfig(): Config {
  return {
    enable_node_deployments: false,
    show_demo_info: false,
    show_terms_of_service: false,
    share_kubeconfig: false,
    openstack: {
      wizard_use_default_user: false,
    },
    cleanup_cluster: false,
  };
}
