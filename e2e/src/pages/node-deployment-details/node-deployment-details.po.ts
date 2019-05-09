import {by, element, ElementFinder} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class NodeDeploymentDetailsPage extends NavPage {
  getNodeDeploymentNameElement(): ElementFinder {
    return element(by.className('km-node-deployment-name'));
  }

  getNodeDeploymentClusterNameElement(): ElementFinder {
    return element(by.id('km-node-deployment-cluster-name'));
  }

  getNodeDeploymentStatusElement(): ElementFinder {
    return element(by.id('km-node-deployment-status'));
  }
}
