import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class WizardPage extends NavPage {
  getNextButton(): any {
    return element(by.id('km-create-cluster-next-btn'));
  }

  getClusterNameInput(): any {
    return element(by.id('km-create-cluster-name-input'));
  }

  getCreateButton(): any {
    return element(by.id('km-create-cluster-create-btn'));
  }

  getProviderButton(providerName: string): any {
    return element(by.className(`km-provider-logo-${providerName}`));
  }

  getDatacenterLocationButton(location: string): any {
    return element(by.xpath(`//div[normalize-space()='${location}']`));
  }

  getDigitalOceanTokenInput(): any {
    return element(by.id('km-digitalocean-token-input'));
  }

  getNodeNameInput(): any {
    return element(by.id('km-node-name-input'));
  }
}
