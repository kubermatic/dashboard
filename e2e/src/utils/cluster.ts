import {ClustersPage} from '../pages/clusters/clusters.po';

import {KMElement} from './element';

export class ClusterUtils {
  private static _clusterPage = new ClustersPage();

  static deleteCluster(clusterName: string): void {
    KMElement.waitForClickable(ClusterUtils._clusterPage.getDeleteClusterBtn());
    ClusterUtils._clusterPage.getDeleteClusterBtn().click();

    KMElement.waitToAppear(ClusterUtils._clusterPage.getDeleteClusterDialog());
    KMElement.sendKeys(ClusterUtils._clusterPage.getDeleteClusterDialogInput(), clusterName);
    KMElement.waitForClickable(ClusterUtils._clusterPage.getDeleteClusterDialogDeleteBtn());
    ClusterUtils._clusterPage.getDeleteClusterDialogDeleteBtn().click();

    KMElement.waitToAppear(ClusterUtils._clusterPage.getAddClusterTopBtn());
    KMElement.waitToDisappear(ClusterUtils._clusterPage.getClusterItem(clusterName));
    expect(ClusterUtils._clusterPage.getClusterItem(clusterName).isPresent()).toBeFalsy();
  }
}
