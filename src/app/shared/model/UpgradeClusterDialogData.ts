export class UpgradeClusterComponentData {
  clusterName: string;
  upgradesList: string[];

  constructor(clusterName: string, upgradesList: string[]) {
    this.clusterName = clusterName;
    this.upgradesList = upgradesList;
  }

}
