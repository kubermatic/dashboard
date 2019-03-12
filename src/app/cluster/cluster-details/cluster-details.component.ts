import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, interval, Subject} from 'rxjs';
import {first, retry, takeUntil} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {AppConfigService} from '../../app-config.service';
import {ApiService, DatacenterService, InitialNodeDataService, UserService} from '../../core/services';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config, UserGroupConfig} from '../../shared/model/Config';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';
import {NodeService} from '../services/node.service';

import {ChangeClusterVersionComponent} from './change-cluster-version/change-cluster-version.component';
import {ClusterConnectComponent} from './cluster-connect/cluster-connect.component';
import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import {EditProviderSettingsComponent} from './edit-provider-settings/edit-provider-settings.component';
import {EditSSHKeysComponent} from './edit-sshkeys/edit-sshkeys.component';
import {ShareKubeconfigComponent} from './share-kubeconfig/share-kubeconfig.component';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss'],
})

export class ClusterDetailsComponent implements OnInit, OnDestroy {
  cluster: ClusterEntity;
  nodeDc: DataCenterEntity;
  datacenter: DataCenterEntity;
  sshKeys: SSHKeyEntity[] = [];
  nodes: NodeEntity[] = [];
  nodeDeployments: NodeDeploymentEntity[];
  isClusterRunning: boolean;
  clusterHealthStatus: ClusterHealthStatus;
  health: HealthEntity;
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  config: Config = {share_kubeconfig: false};
  updatesAvailable = false;
  downgradesAvailable = false;
  moreSshKeys = false;
  hasInitialNodes = false;
  someUpgradesRestrictedByKubeletVersion = false;
  private unsubscribe: Subject<any> = new Subject();
  private clusterSubject: Subject<ClusterEntity>;
  private versionsList: string[] = [];
  private refreshInterval = 10000;

  constructor(
      private route: ActivatedRoute, private router: Router, private api: ApiService, public dialog: MatDialog,
      private initialNodeDataService: InitialNodeDataService, private dcService: DatacenterService,
      private userService: UserService, private appConfigService: AppConfigService,
      private readonly node_: NodeService) {
    this.clusterSubject = new Subject<ClusterEntity>();
  }

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig();
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    const clusterName = this.route.snapshot.paramMap.get('clusterName');
    const seedDCName = this.route.snapshot.paramMap.get('seedDc');
    this.projectID = this.route.snapshot.paramMap.get('projectID');

    this.userService.currentUserGroup(this.projectID).pipe(takeUntil(this.unsubscribe)).subscribe((group) => {
      this.userGroup = group;
    });

    this.initialNodeCreation();

    // Node datacenter & ssh keys - both once
    const onceSub = this.clusterSubject.subscribe((cluster) => {
      this.dcService.getDataCenter(cluster.spec.cloud.dc).pipe(takeUntil(this.unsubscribe)).subscribe((datacenter) => {
        this.nodeDc = datacenter;
      });
      this.api.getClusterSSHKeys(clusterName, seedDCName, this.projectID)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((keys) => {
            this.sshKeys = keys;
          });

      onceSub.unsubscribe();
    });

    // Health
    this.clusterSubject.pipe(takeUntil(this.unsubscribe)).subscribe((cluster) => {
      this.api.getClusterHealth(cluster.id, seedDCName, this.projectID).subscribe((health) => {
        this.health = health;
        this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
        this.clusterHealthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);
        this.reloadClusterNodes();
        this.reloadVersions();
      });
    });

    // Upgrades
    this.clusterSubject.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
      this.reloadVersions();
    });
    // Nodes
    this.clusterSubject.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
      this.initialNodeCreation();
      this.reloadClusterNodes();
    });

    combineLatest(
        this.dcService.getDataCenter(seedDCName), this.api.getCluster(clusterName, seedDCName, this.projectID))
        .pipe(takeUntil(this.unsubscribe), retry(3))
        .subscribe(
            (data: any[]):
                void => {
                  this.datacenter = data[0];
                  this.cluster = data[1];
                  this.clusterSubject.next(data[1]);

                  const timer = interval(this.refreshInterval);
                  timer.pipe(takeUntil(this.unsubscribe))
                      .subscribe(() => this.reloadCluster(clusterName, seedDCName, this.projectID));
                },
            (error) => {
              if (error.status === 404) {
                this.router.navigate(['404']);
              }
            });
  }

  reloadCluster(clusterName: string, seedDCName: string, projectID: string): void {
    this.api.getCluster(clusterName, seedDCName, projectID)
        .pipe(takeUntil(this.unsubscribe), retry(3))
        .subscribe((res) => {
          this.cluster = res;
          this.clusterSubject.next(res);
          this.reloadVersions();
        });
  }

  initialNodeCreation(): void {
    if (!!this.cluster && !!this.initialNodeDataService.getInitialNodeData(this.cluster)) {
      this.hasInitialNodes = true;
    }

    if (this.health && HealthEntity.allHealthy(this.health)) {
      const initialNodeCreationSub = this.clusterSubject.pipe(takeUntil(this.unsubscribe)).subscribe((cluster) => {
        const data = this.initialNodeDataService.getInitialNodeData(cluster);
        if (data == null && initialNodeCreationSub) {
          initialNodeCreationSub.unsubscribe();
          this.hasInitialNodes = false;
          return;
        }

        if (cluster && this.health && HealthEntity.allHealthy(this.health)) {
          this.node_.createInitialNodes(data, this.datacenter, cluster, this.projectID);
          this.initialNodeDataService.clearInitialNodeData(cluster);
        }
      });
    }
  }

  reloadClusterNodes(): void {
    if (this.cluster && this.health && HealthEntity.allHealthy(this.health)) {
      this.api.getClusterNodes(this.cluster.id, this.datacenter.metadata.name, this.projectID)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((nodes) => {
            this.nodes = nodes;
          });

      this.api.getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this.projectID)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((nodeDeployments) => {
            this.nodeDeployments = nodeDeployments;
          });
    }
  }

  reloadVersions(): void {
    if (this.cluster && this.health && this.health.apiserver && this.health.machineController) {
      this.api.getClusterUpgrades(this.projectID, this.datacenter.metadata.name, this.cluster.id)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((upgrades) => {
            this.versionsList = [];
            this.updatesAvailable = false;
            for (const i in upgrades) {
              if (upgrades.hasOwnProperty(i)) {
                const isUpgrade = lt(this.cluster.spec.version, upgrades[i].version);
                const isDowngrade = gt(this.cluster.spec.version, upgrades[i].version);

                if (upgrades[i].restrictedByKubeletVersion === true) {
                  if (isUpgrade) {
                    this.someUpgradesRestrictedByKubeletVersion = true;  // Show warning only for restricted upgrades.
                  }
                  continue;  // Skip all restricted versions.
                }

                if (isUpgrade) {
                  this.updatesAvailable = true;
                } else if (isDowngrade) {
                  this.downgradesAvailable = true;
                }

                if (this.versionsList.indexOf(upgrades[i].version) < 0) {
                  this.versionsList.push(upgrades[i].version);
                }
              }
            }
          });
    }
  }

  addNode(): void {
    this.node_.showNodeDeploymentCreateDialog(this.nodes.length, this.cluster, this.projectID, this.datacenter)
        .pipe(first())
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.reloadClusterNodes();
          }
        });
  }

  deleteClusterDialog(): void {
    const modal = this.dialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal.afterClosed().pipe(first()).subscribe((deleted) => {
      if (deleted) {
        this.router.navigate(['/projects/' + this.projectID + '/clusters']);
      }
    });
  }

  connectClusterDialog(): void {
    const modal = this.dialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  shareConfigDialog(): void {
    const modal = this.dialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  changeClusterVersionDialog(): void {
    const modal = this.dialog.open(ChangeClusterVersionComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.controlPlaneVersions = this.versionsList;
    modal.afterClosed().pipe(first()).subscribe(() => {
      this.reloadCluster(this.cluster.id, this.datacenter.metadata.name, this.projectID);
    });
  }

  getDownloadURL(): string {
    return this.api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  editProviderSettings(): void {
    const modal = this.dialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
  }

  editSSHKeys(): void {
    const modal = this.dialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal.afterClosed().pipe(first()).subscribe(() => {
      this.api.getClusterSSHKeys(this.cluster.id, this.datacenter.metadata.name, this.projectID)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((keys) => {
            this.sshKeys = keys;
          });
    });
  }

  loadMoreSshKeys(moreSshKeys: boolean): void {
    this.moreSshKeys = moreSshKeys;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
