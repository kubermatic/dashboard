import { Config } from '../../shared/model/Config';

export function fakeAppConfig(): Config {
  return {
    show_demo_info: false,
    openstack: {
      wizard_use_default_user: false
    }
  }
}
