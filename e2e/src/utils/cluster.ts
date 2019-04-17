import {ClustersPage} from '../pages/clusters/clusters.po';

import {KMElement} from './element';

export class ClusterUtils {
  private static _clusterPage = new ClustersPage();

  static async deleteCluster(clusterName: string, waitTimeout = 60000) {
    await ClusterUtils._clusterPage.navigateTo();

    await KMElement.click(ClusterUtils._clusterPage.getClusterItem(clusterName));

    await KMElement.click(ClusterUtils._clusterPage.getDeleteClusterBtn());

    await KMElement.waitToAppear(ClusterUtils._clusterPage.getDeleteClusterDialog());
    await KMElement.fill(ClusterUtils._clusterPage.getDeleteClusterDialogInput(), clusterName);
    await KMElement.click(ClusterUtils._clusterPage.getDeleteClusterDialogDeleteBtn());

    await KMElement.waitToAppear(ClusterUtils._clusterPage.getAddClusterTopBtn());
    await KMElement.waitToDisappear(ClusterUtils._clusterPage.getClusterItem(clusterName), waitTimeout);
    expect(await ClusterUtils._clusterPage.getClusterItem(clusterName).isPresent()).toBeFalsy();
  }
}
