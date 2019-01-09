import {NavPage} from "../../shared/nav.po";
import {by, element} from "protractor";

export class CreateClusterPage extends NavPage {
  private _nextButton = by.id('km-create-cluster-next-btn');
  private _clusterNameInput = by.id('km-create-cluster-name-input');
  private _createButton = by.id('km-create-cluster-create-btn');

  getNextButton(): any {
    return element(this._nextButton);
  }

  getClusterNameInput(): any {
    return element(this._clusterNameInput);
  }

  getCreateButton(): any {
    return element(this._createButton);
  }

  getProviderButton(providerName: string): any {
    return element(by.className(`provider-logo-${providerName}`));
  }

  getDatacenterLocationButton(location: string): any {
    return element(by.xpath(`//div[normalize-space()='${location}']`));
  }
}
