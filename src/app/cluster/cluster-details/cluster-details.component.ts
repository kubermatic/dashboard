import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, merge, Subject, timer} from 'rxjs';
import {first, retry, switchMap, takeUntil} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {AppConfigService} from '../../app-config.service';
import {ApiService, DatacenterService, ProjectService} from '../../core/services';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../shared/entity/EventEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config} from '../../shared/model/Config';
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
  moreSshKeys = false;
  someUpgradesRestrictedByKubeletVersion = false;
  projectID: string;
  events: EventEntity[] = [];
  displayedSSHKeys = 3;
  private _versionsList: string[] = [];
  private _externalClusterUpdate: Subject<any> = new Subject();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _route: ActivatedRoute, private readonly _router: Router,
      private readonly _apiService: ApiService, private readonly _matDialog: MatDialog,
      private readonly _datacenterService: DatacenterService, private readonly _appConfigService: AppConfigService,
      private readonly _node: NodeService, private readonly _projectService: ProjectService) {}

  ngOnInit(): void {
    this.config = this._appConfigService.getConfig();
    this.projectID = this._route.snapshot.paramMap.get('projectID');
    const clusterName = this._route.snapshot.paramMap.get('clusterName');
    const seedDCName = this._route.snapshot.paramMap.get('seedDc');

    combineLatest(
        this._datacenterService.getDataCenter(seedDCName),
        this._apiService.getCluster(clusterName, seedDCName, this._projectService.getCurrentProjectId()))
        .pipe(retry(3))
        .pipe(first())
        .pipe(switchMap(([datacenter, cluster]) => {
          this.datacenter = datacenter;
          this.cluster = cluster;

          return combineLatest(
              this._apiService.getClusterSSHKeys(
                  cluster.id, datacenter.metadata.name, this._projectService.getCurrentProjectId()),
              this._datacenterService.getDataCenter(cluster.spec.cloud.dc),
          );
        }))
        .pipe(first())
        .pipe(switchMap(([keys, datacenter]) => {
          this.sshKeys = keys;
          this.nodeDc = datacenter;

          return merge(timer(0, 10 * this._appConfigService.getRefreshTimeBase()), this._externalClusterUpdate);
        }))
        .pipe(switchMap(() => {
          return combineLatest(
              this._apiService.getCluster(
                  this.cluster.id, this.datacenter.metadata.name, this._projectService.getCurrentProjectId()),
              this._apiService.getClusterHealth(
                  this.cluster.id, seedDCName, this._projectService.getCurrentProjectId()),
              this._apiService.getClusterEvents(
                  this.cluster.id, this.datacenter.metadata.name, this._projectService.getCurrentProjectId()));
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
      this._apiService
          .getClusterUpgrades(
              this._projectService.getCurrentProjectId(), this.datacenter.metadata.name, this.cluster.id)
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
      this._apiService
          .getClusterNodes(this.cluster.id, this.datacenter.metadata.name, this._projectService.getCurrentProjectId())
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodes) => {
            this.nodes = nodes;
          });

      this._apiService
          .getNodeDeployments(
              this.cluster.id, this.datacenter.metadata.name, this._projectService.getCurrentProjectId())
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((nodeDeployments) => {
            this.nodeDeployments = nodeDeployments;
            this.isNodeDeploymentLoadFinished = true;
          });
    }
  }

  isAddNodeDeploymentsEnabled(): boolean {
    return this.isClusterRunning &&
        (!this._projectService.getUserGroupConfig() ||
         this._projectService.getUserGroupConfig().nodeDeployments.create);
  }

  addNode(): void {
    this._node
        .showNodeDeploymentCreateDialog(
            this.nodes.length, this.cluster, this._projectService.getCurrentProjectId(), this.datacenter)
        .pipe(first())
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.reloadClusterNodes();
          }
        });
  }

  isDeleteEnabled(): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().clusters.delete;
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.getCurrentProjectId();
    modal.afterClosed().pipe(first()).subscribe((deleted) => {
      if (deleted) {
        this._router.navigate(['/projects/' + this._projectService.getCurrentProjectId() + '/clusters']);
      }
    });
  }

  connectClusterDialog(): void {
    const modal = this._matDialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.getCurrentProjectId();
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.getCurrentProjectId();
  }

  changeClusterVersionDialog(): void {
    const modal = this._matDialog.open(ChangeClusterVersionComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.controlPlaneVersions = this._versionsList;
    modal.afterClosed().pipe(first()).subscribe((isChanged) => {
      if (isChanged) {
        this._externalClusterUpdate.next();
      }
    });
  }

  getDownloadURL(): string {
    return this._apiService.getKubeconfigURL(
        this._projectService.getCurrentProjectId(), this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().clusters.edit;
  }

  editProviderSettings(): void {
    const modal = this._matDialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
  }

  isSSHKeysEditEnabled(): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().sshKeys.edit;
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this._projectService.getCurrentProjectId();
    modal.afterClosed().pipe(first()).subscribe(() => {
      this._apiService
          .getClusterSSHKeys(this.cluster.id, this.datacenter.metadata.name, this._projectService.getCurrentProjectId())
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
