import { Config } from '../../shared/model/Config';

export function fakeAppConfig(): Config {
  return {
    show_demo_info: false,
    show_terms_of_service: false,
    openstack: {
      wizard_use_default_user: false,
    },
  };
}
