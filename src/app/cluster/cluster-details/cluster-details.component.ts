import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {AppConfigService} from '../../app-config.service';
import {ApiService, ClusterService, DatacenterService, UserService} from '../../core/services';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../shared/entity/EventEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config, GroupConfig} from '../../shared/model/Config';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';
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
  isNodeDeploymentLoadFinished = false;
  isClusterRunning: boolean;
  clusterHealthStatus: ClusterHealthStatus;
  health: HealthEntity;
  config: Config = {share_kubeconfig: false};
  updatesAvailable = false;
  downgradesAvailable = false;
  someUpgradesRestrictedByKubeletVersion = false;
  projectID: string;
  events: EventEntity[] = [];
  displayedSSHKeys = 3;
  private _versionsList: string[] = [];
  private _unsubscribe: Subject<any> = new Subject();
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _route: ActivatedRoute, private readonly _router: Router,
      private readonly _clusterService: ClusterService, private readonly _matDialog: MatDialog,
      private readonly _datacenterService: DatacenterService, private readonly _appConfigService: AppConfigService,
      private readonly _node: NodeService, private readonly _userService: UserService,
      private readonly _api: ApiService) {}

  ngOnInit(): void {
    this.config = this._appConfigService.getConfig();
    this.projectID = this._route.snapshot.paramMap.get('projectID');
    const clusterID = this._route.snapshot.paramMap.get('clusterName');
    const seedDCName = this._route.snapshot.paramMap.get('seedDc');

    this._userService.currentUserGroup(this.projectID)
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    combineLatest([
      this._datacenterService.getDataCenter(seedDCName),
      this._clusterService.cluster(this.projectID, clusterID, seedDCName)
    ])
        .pipe(switchMap(([datacenter, cluster]) => {
          this.datacenter = datacenter;
          this.cluster = cluster;

          return combineLatest(
              [
                this._clusterService.sshKeys(this.projectID, cluster.id, datacenter.metadata.name),
                this._datacenterService.getDataCenter(cluster.spec.cloud.dc)
              ],
          );
        }))
        .pipe(switchMap(([keys, datacenter]) => {
          this.sshKeys = keys;
          this.nodeDc = datacenter;

          return combineLatest([
            this._clusterService.cluster(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.health(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.events(this.projectID, this.cluster.id, this.datacenter.metadata.name)
          ]);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            ([cluster, health, events]) => {
              this.cluster = cluster;
              this.health = health;
              this.events = events;
              this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
              this.clusterHealthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);

              this._reloadVersions();
              this.reloadClusterNodes();
            },
            (error) => {
              if (error.status === 404) {
                this._router.navigate(['404']);
              }
            });
  }

  private _reloadVersions(): void {
    if (this.cluster && this.health && this.health.apiserver && this.health.machineController) {
      this._clusterService.upgrades(this.projectID, this.cluster.id, this.datacenter.metadata.name)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((upgrades) => {
            this._versionsList = [];
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

                if (this._versionsList.indexOf(upgrades[i].version) < 0) {
                  this._versionsList.push(upgrades[i].version);
                }
              }
            }
          });
    }
  }

  getType(type: string): string {
    return ClusterUtils.getType(type);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  reloadClusterNodes(): void {
    if (this.cluster && HealthEntity.allHealthy(this.health)) {
      this._clusterService.nodes(this.projectID, this.cluster.id, this.datacenter.metadata.name)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodes) => {
            this.nodes = nodes;
          });

      this._api.getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this.projectID)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodeDeployments) => {
            this.nodeDeployments = nodeDeployments;
            this.isNodeDeploymentLoadFinished = true;
          });
    }
  }

  isAddNodeDeploymentsEnabled(): boolean {
    return this.isClusterRunning && (!this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.create);
  }

  addNode(): void {
    this._node.showNodeDeploymentCreateDialog(this.nodes.length, this.cluster, this.projectID, this.datacenter)
        .pipe(first())
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.reloadClusterNodes();
          }
        });
  }

  isDeleteEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.delete;
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal.afterClosed().pipe(first()).subscribe((deleted) => {
      if (deleted) {
        this._router.navigate(['/projects/' + this.projectID + '/clusters']);
      }
    });
  }

  connectClusterDialog(): void {
    const modal = this._matDialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  changeClusterVersionDialog(): void {
    const modal = this._matDialog.open(ChangeClusterVersionComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.controlPlaneVersions = this._versionsList;
    modal.afterClosed().pipe(first()).subscribe((isChanged) => {
      if (isChanged) {
        this._clusterService.onClusterUpdate.next();
      }
    });
  }

  getDownloadURL(): string {
    return this._api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.edit;
  }

  editProviderSettings(): void {
    const modal = this._matDialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
  }

  isSSHKeysEditEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.sshKeys.edit;
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal.afterClosed().pipe(first()).subscribe(() => {
      this._clusterService.sshKeys(this.projectID, this.cluster.id, this.datacenter.metadata.name)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((keys) => {
            this.sshKeys = keys;
          });
    });
  }

  getTruncatedSSHKeys(): string {
    return this.sshKeys.slice(this.displayedSSHKeys).map(key => key.name).join(', ');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
