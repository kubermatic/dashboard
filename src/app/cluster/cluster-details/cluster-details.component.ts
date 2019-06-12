import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, of, Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {AppConfigService} from '../../app-config.service';
import {ApiService, ClusterService, DatacenterService, UserService} from '../../core/services';
import {ClusterEntity, getClusterProvider, MasterVersion} from '../../shared/entity/ClusterEntity';
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
      this._clusterService.cluster(this.projectID, clusterID, seedDCName),
    ])
        .pipe(switchMap(([seedDatacenter, cluster]) => {
          this.datacenter = seedDatacenter;
          this.cluster = cluster;

          return this._datacenterService.getDataCenter(cluster.spec.cloud.dc);
        }))
        .pipe(switchMap((datacenter) => {
          this.nodeDc = datacenter;

          return combineLatest([
            this._clusterService.sshKeys(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.health(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.events(this.projectID, this.cluster.id, this.datacenter.metadata.name),
          ]);
        }))
        .pipe(switchMap(([keys, health, events]) => {
          this.sshKeys = keys;
          this.health = health;
          this.events = events;
          this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
          this.clusterHealthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);

          // Conditionally create an array of observables to use for 'combineLatest' operator.
          // In case real observable should not be returned, observable emitting empty array will be added to the array.
          const reload$ =
              [].concat(
                    this._canReloadVersions() ?
                        this._clusterService.upgrades(this.projectID, this.cluster.id, this.datacenter.metadata.name) :
                        of([]))
                  .concat(
                      this._canReloadNodes() ?
                          [
                            this._clusterService.nodes(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                            this._api.getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this.projectID)
                          ] :
                          [of([]), of([])],
                  );

          return combineLatest(reload$);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            ([upgrades, nodes, nodeDeployments]: [MasterVersion[], NodeEntity[], NodeDeploymentEntity[]]) => {
              this.nodes = nodes;
              this.nodeDeployments = nodeDeployments;
              this.isNodeDeploymentLoadFinished = nodeDeployments.length > 0;
              this.updatesAvailable = false;

              upgrades.forEach(upgrade => {
                const isUpgrade = lt(this.cluster.spec.version, upgrade.version);
                const isDowngrade = gt(this.cluster.spec.version, upgrade.version);

                if (upgrade.restrictedByKubeletVersion === true) {
                  this.someUpgradesRestrictedByKubeletVersion = isUpgrade;
                  return;  // Skip all restricted versions.
                }

                this.updatesAvailable = this.updatesAvailable ? true : isUpgrade;
                this.downgradesAvailable = this.downgradesAvailable ? true : isDowngrade;

                if (this._versionsList.indexOf(upgrade.version) < 0) {
                  this._versionsList.push(upgrade.version);
                }
              });
            },
            (error) => {
              if (error.status === 404) {
                this._router.navigate(['404']);
              }
            });
  }

  private _canReloadVersions() {
    return this.cluster && this.health && this.health.apiserver && this.health.machineController;
  }

  private _canReloadNodes() {
    return this.cluster && HealthEntity.allHealthy(this.health);
  }

  getType(type: string): string {
    return ClusterUtils.getType(type);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  isAddNodeDeploymentsEnabled(): boolean {
    return this.isClusterRunning && (!this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.create);
  }

  addNode(): void {
    this._node.showNodeDeploymentCreateDialog(this.nodes.length, this.cluster, this.projectID, this.datacenter)
        .pipe(first())
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this._clusterService.onClusterUpdate.next();
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
    modal.afterClosed().pipe(first()).subscribe(isChanged => {
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
    modal.afterClosed().pipe(first()).subscribe(isChanged => {
      if (isChanged) {
        this._clusterService.onClusterUpdate.next();
      }
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
