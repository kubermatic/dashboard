import {by, element, ElementFinder} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class NodeDeploymentDetailsPage extends NavPage {
  private _nodeDeploymentName = by.className('km-node-deployment-name');
  private _nodeDeploymentClusterName = by.id('km-node-deployment-cluster-name');
  private _nodeDeploymentStatus = by.id('km-node-deployment-status');

  getNodeDeploymentNameElement(): ElementFinder {
    return element(this._nodeDeploymentName);
  }

  getNodeDeploymentClusterNameElement(): ElementFinder {
    return element(this._nodeDeploymentClusterName);
  }

  getNodeDeploymentStatusElement(): ElementFinder {
    return element(this._nodeDeploymentStatus);
  }
}
