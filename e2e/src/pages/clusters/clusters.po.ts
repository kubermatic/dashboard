import {by, element} from 'protractor';

import {NavPage} from '../shared/nav.po';
import {KMElement} from '../../utils/element';

export class ClustersPage extends NavPage {
  navigateTo(): any {
    return KMElement.click(super.getClustersNavButton());
  }

  getClusterItem(clusterName: string): any {
    return element(by.id(`km-clusters-${clusterName}`));
  }

  getDeleteClusterBtn(): any {
    return element(by.id('km-delete-cluster-btn'));
  }

  getDeleteClusterDialog(): any {
    return element(by.id('km-delete-cluster-dialog'));
  }

  getDeleteClusterDialogDeleteBtn(): any {
    return element(by.id('km-delete-cluster-dialog-delete-btn'));
  }

  getDeleteClusterDialogInput(): any {
    return element(by.id('km-delete-cluster-dialog-input'));
  }

  getAddClusterTopBtn(): any {
    return element(by.id('km-add-cluster-top-btn'));
  }

  getNodeDeploymentItem(nodeDeploymentName: string): any {
    return element(by.id(nodeDeploymentName));
  }

  getNodeDeploymentRemoveBtn(nodeDeploymentName: string): any {
    return element(by.xpath(`//*[@id="${nodeDeploymentName}"]//*[contains(@class, 'fa fa-trash-o')]`));
  }
}
