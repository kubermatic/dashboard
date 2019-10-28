import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, of, Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../app-config.service';
import {ApiService, ClusterService, DatacenterService, UserService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {AddonEntity} from '../../shared/entity/AddonEntity';
import {ClusterEntity, getClusterProvider, MasterVersion} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../shared/entity/EventEntity';
import {HealthEntity, HealthState} from '../../shared/entity/HealthEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config, GroupConfig} from '../../shared/model/Config';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../shared/utils/cluster-utils/cluster-utils';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';
import {NodeService} from '../services/node.service';

import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import {ConfigurePodSecurityComponent} from './configure-pod-security/configure-pod-security.component';
import {EditClusterComponent} from './edit-cluster/edit-cluster.component';
import {EditSSHKeysComponent} from './edit-sshkeys/edit-sshkeys.component';
import {RevokeTokenComponent} from './revoke-token/revoke-token.component';
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
  isClusterRunning = false;
  isClusterAPIRunning = false;
  clusterHealthStatus: ClusterHealthStatus;
  health: HealthEntity;
  config: Config = {share_kubeconfig: false};
  projectID: string;
  events: EventEntity[] = [];
  addons: AddonEntity[] = [];
  upgrades: MasterVersion[] = [];
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
          this.sshKeys = keys.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          this.health = health;
          this.events = events;
          this.isClusterAPIRunning = ClusterHealthStatus.isClusterAPIRunning(this.cluster, health);
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
                            this._clusterService.addons(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                            this._clusterService.nodes(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                            this._api.getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this.projectID)
                          ] :
                          [of([]), of([]), of([])],
                  );

          return combineLatest(reload$);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            ([upgrades, addons, nodes,
              nodeDeployments]: [MasterVersion[], AddonEntity[], NodeEntity[], NodeDeploymentEntity[]]) => {
              this.addons = addons;
              this.nodes = nodes;
              this.nodeDeployments = nodeDeployments;
              this.isNodeDeploymentLoadFinished = true;
              this.upgrades = upgrades;
            },
            (error) => {
              if (error.status === 404) {
                this._router.navigate(['404']);
              }
            });
  }

  private _canReloadVersions(): boolean {
    return this.cluster && this.health && HealthState.isUp(this.health.apiserver) &&
        HealthState.isUp(this.health.machineController);
  }

  private _canReloadNodes(): boolean {
    return this.cluster && HealthEntity.allHealthy(this.health);
  }

  getProvider(provider: string): string {
    return provider === 'google' ? 'gcp' : provider;
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

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  getDownloadURL(): string {
    return this.isClusterAPIRunning ?
        this._api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id) :
        '';
  }

  getProxyURL(): string {
    return this.cluster.type === ClusterType.OpenShift ?
        this._api.getOpenshiftProxyURL(this.projectID, this.datacenter.metadata.name, this.cluster.id) :
        this._api.getDashboardProxyURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.edit;
  }

  editCluster(): void {
    const modal = this._matDialog.open(EditClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
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

  isRevokeTokenEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.edit;
  }

  revokeToken(): void {
    const dialogRef = this._matDialog.open(RevokeTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  configPodSecurity(): void {
    const dialogRef = this._matDialog.open(ConfigurePodSecurityComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  handleAddonCreation(addon: AddonEntity): void {
    this._clusterService.createAddon(addon, this.projectID, this.cluster.id, this.datacenter.metadata.name)
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          NotificationActions.success(`The ${addon.name} addon has been added to the ${this.cluster.name} cluster`);
        });
  }

  handleAddonDeletion(addon: AddonEntity): void {
    this._clusterService.deleteAddon(addon.id, this.projectID, this.cluster.id, this.datacenter.metadata.name)
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          NotificationActions.success(`The ${addon.name} addon has been removed from the ${this.cluster.name} cluster`);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
