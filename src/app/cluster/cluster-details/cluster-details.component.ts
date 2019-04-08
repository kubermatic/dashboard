import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, interval, Subject} from 'rxjs';
import {first, retry, takeUntil} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {AppConfigService} from '../../app-config.service';
import {ApiService, DatacenterService, ProjectService} from '../../core/services';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config} from '../../shared/model/Config';
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
  config: Config = {share_kubeconfig: false};
  updatesAvailable = false;
  downgradesAvailable = false;
  moreSshKeys = false;
  someUpgradesRestrictedByKubeletVersion = false;
  projectID: string;
  private versionsList: string[] = [];
  private refreshInterval = 10000;
  private clusterSubject: Subject<ClusterEntity> = new Subject<ClusterEntity>();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _route: ActivatedRoute, private readonly _router: Router,
      private readonly _apiService: ApiService, private readonly _matDialog: MatDialog,
      private readonly _datacenterService: DatacenterService, private appConfigService: AppConfigService,
      private readonly _node: NodeService, private readonly _projectService: ProjectService) {}

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig();
    this.projectID = this._route.snapshot.paramMap.get('projectID');
    const clusterName = this._route.snapshot.paramMap.get('clusterName');
    const seedDCName = this._route.snapshot.paramMap.get('seedDc');

    // Node datacenter & ssh keys - both once
    this.clusterSubject.pipe(first()).subscribe((cluster) => {
      this._datacenterService.getDataCenter(cluster.spec.cloud.dc)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((datacenter) => {
            this.nodeDc = datacenter;
          });
      this._apiService.getClusterSSHKeys(clusterName, seedDCName, this._projectService.project.id)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((keys) => {
            this.sshKeys = keys;
          });
    });

    // Health
    this.clusterSubject.pipe(takeUntil(this._unsubscribe)).subscribe((cluster) => {
      this._apiService.getClusterHealth(cluster.id, seedDCName, this._projectService.project.id).subscribe((health) => {
        this.health = health;
        this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
        this.clusterHealthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);
        this.reloadClusterNodes();
        this.reloadVersions();
      });
    });

    // Upgrades
    this.clusterSubject.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.reloadVersions();
    });
    // Nodes
    this.clusterSubject.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.reloadClusterNodes();
    });

    combineLatest(
        this._datacenterService.getDataCenter(seedDCName),
        this._apiService.getCluster(clusterName, seedDCName, this._projectService.project.id))
        .pipe(takeUntil(this._unsubscribe), retry(3))
        .subscribe(
            (data: any[]):
                void => {
                  this.datacenter = data[0];
                  this.cluster = data[1];
                  this.clusterSubject.next(data[1]);

                  interval(this.refreshInterval)
                      .pipe(takeUntil(this._unsubscribe))
                      .subscribe(() => this.reloadCluster(clusterName, seedDCName, this._projectService.project.id));
                },
            (error) => {
              if (error.status === 404) {
                this._router.navigate(['404']);
              }
            });
  }

  reloadCluster(clusterName: string, seedDCName: string, projectID: string): void {
    this._apiService.getCluster(clusterName, seedDCName, projectID)
        .pipe(takeUntil(this._unsubscribe), retry(3))
        .subscribe((res) => {
          this.cluster = res;
          this.clusterSubject.next(res);
          this.reloadVersions();
        });
  }

  reloadClusterNodes(): void {
    if (this.cluster && this.health && HealthEntity.allHealthy(this.health)) {
      this._apiService.getClusterNodes(this.cluster.id, this.datacenter.metadata.name, this._projectService.project.id)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodes) => {
            this.nodes = nodes;
          });

      this._apiService
          .getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this._projectService.project.id)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodeDeployments) => {
            this.nodeDeployments = nodeDeployments;
          });
    }
  }

  reloadVersions(): void {
    if (this.cluster && this.health && this.health.apiserver && this.health.machineController) {
      this._apiService
          .getClusterUpgrades(this._projectService.project.id, this.datacenter.metadata.name, this.cluster.id)
          .pipe(takeUntil(this._unsubscribe))
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

  isAddNodeDeploymentsEnabled(): boolean {
    return this.isClusterRunning &&
        (!this._projectService.userGroup ||
         this._projectService.userGroupConfig[this._projectService.userGroup].nodeDeployments.create);
  }

  addNode(): void {
    this._node
        .showNodeDeploymentCreateDialog(
            this.nodes.length, this.cluster, this._projectService.project.id, this.datacenter)
        .pipe(first())
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.reloadClusterNodes();
          }
        });
  }

  isDeleteEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].clusters.delete;
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.project.id;
    modal.afterClosed().pipe(first()).subscribe((deleted) => {
      if (deleted) {
        this._router.navigate(['/projects/' + this._projectService.project.id + '/clusters']);
      }
    });
  }

  connectClusterDialog(): void {
    const modal = this._matDialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.project.id;
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.project.id;
  }

  changeClusterVersionDialog(): void {
    const modal = this._matDialog.open(ChangeClusterVersionComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.controlPlaneVersions = this.versionsList;
    modal.afterClosed().pipe(first()).subscribe(() => {
      this.reloadCluster(this.cluster.id, this.datacenter.metadata.name, this._projectService.project.id);
    });
  }

  getDownloadURL(): string {
    return this._apiService.getKubeconfigURL(
        this._projectService.project.id, this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].clusters.edit;
  }

  editProviderSettings(): void {
    const modal = this._matDialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
  }

  isSSHKeysEditEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].sshKeys.edit;
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.project.id;
    modal.afterClosed().pipe(first()).subscribe(() => {
      this._apiService
          .getClusterSSHKeys(this.cluster.id, this.datacenter.metadata.name, this._projectService.project.id)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((keys) => {
            this.sshKeys = keys;
          });
    });
  }

  loadMoreSshKeys(moreSshKeys: boolean): void {
    this.moreSshKeys = moreSshKeys;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
