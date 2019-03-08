import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';

export class ClustersPage extends NavPage {
  private _deleteClusterBtn = by.id('km-delete-cluster-btn');
  private _deleteClusterDialog = by.id('km-delete-cluster-dialog');
  private _deleteClusterDialogDeleteBtn = by.id('km-delete-cluster-dialog-delete-btn');
  private _deleteClusterDialogInput = by.id('km-delete-cluster-dialog-input');
  private _addClusterTopBtn = by.id('km-add-cluster-top-btn');

  navigateTo(): any {
    return this.getClustersNavButton().click();
  }

  getClusterItem(clusterName: string): any {
    return element(by.id(`km-clusters-${clusterName}`));
  }

  getDeleteClusterBtn(): any {
    return element(this._deleteClusterBtn);
  }

  getDeleteClusterDialog(): any {
    return element(this._deleteClusterDialog);
  }

  getDeleteClusterDialogDeleteBtn(): any {
    return element(this._deleteClusterDialogDeleteBtn);
  }

  getDeleteClusterDialogInput(): any {
    return element(this._deleteClusterDialogInput);
  }

  getAddClusterTopBtn(): any {
    return element(this._addClusterTopBtn);
  }

  getNodeDeploymentItem(nodeDeploymentName: string): any {
    return element(by.id(nodeDeploymentName));
  }
}
