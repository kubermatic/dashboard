import {ClustersPage} from '../pages/clusters/clusters.po';

import {KMElement} from './element';

export class ClusterUtils {
  private static _clusterPage = new ClustersPage();

  static deleteCluster(clusterName: string, waitTimeout = 60000): void {
    ClusterUtils._clusterPage.navigateTo();

    KMElement.waitToAppear(ClusterUtils._clusterPage.getClusterItem(clusterName));
    ClusterUtils._clusterPage.getClusterItem(clusterName).click();

    KMElement.waitForClickable(ClusterUtils._clusterPage.getDeleteClusterBtn());
    ClusterUtils._clusterPage.getDeleteClusterBtn().click();

    KMElement.waitToAppear(ClusterUtils._clusterPage.getDeleteClusterDialog());
    KMElement.sendKeys(ClusterUtils._clusterPage.getDeleteClusterDialogInput(), clusterName);
    KMElement.waitForClickable(ClusterUtils._clusterPage.getDeleteClusterDialogDeleteBtn());
    ClusterUtils._clusterPage.getDeleteClusterDialogDeleteBtn().click();

    KMElement.waitToAppear(ClusterUtils._clusterPage.getAddClusterTopBtn());
    KMElement.waitToDisappear(ClusterUtils._clusterPage.getClusterItem(clusterName), waitTimeout);
    expect(ClusterUtils._clusterPage.getClusterItem(clusterName).isPresent()).toBeFalsy();
  }
}
