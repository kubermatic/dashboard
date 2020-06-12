import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, iif, Observable, of, Subject} from 'rxjs';
import {first, map, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../app-config.service';
import {
  ApiService,
  ClusterService,
  DatacenterService,
  NotificationService,
  RBACService,
  UserService,
} from '../../core/services';
import {SettingsService} from '../../core/services/settings/settings.service';
import {AddonEntity} from '../../shared/entity/addon';
import {ClusterEntity, ClusterType, getClusterProvider, MasterVersion} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../shared/entity/EventEntity';
import {HealthEntity, HealthState} from '../../shared/entity/HealthEntity';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {ClusterMetrics} from '../../shared/entity/Metrics';
import {NodeDeployment} from '../../shared/entity/node-deployment';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {Binding, ClusterBinding, SimpleBinding, SimpleClusterBinding} from '../../shared/entity/RBACEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Config, GroupConfig} from '../../shared/model/Config';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';
import {MemberUtils, Permission} from '../../shared/utils/member-utils/member-utils';
import {NodeService} from '../services/node.service';

import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import {EditClusterComponent} from './edit-cluster/edit-cluster.component';
import {EditSSHKeysComponent} from './edit-sshkeys/edit-sshkeys.component';
import {RevokeTokenComponent} from './revoke-token/revoke-token.component';
import {ShareKubeconfigComponent} from './share-kubeconfig/share-kubeconfig.component';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss'],
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
  cluster: ClusterEntity;
  nodeDc: DataCenterEntity;
  datacenter: DataCenterEntity;
  sshKeys: SSHKeyEntity[] = [];
  nodes: NodeEntity[] = [];
  nodeDeployments: NodeDeployment[];
  isNodeDeploymentLoadFinished = false;
  isClusterRunning = false;
  isClusterAPIRunning = false;
  clusterHealthStatus: ClusterHealthStatus;
  health: HealthEntity;
  config: Config = {share_kubeconfig: false};
  projectID: string;
  metrics: ClusterMetrics;
  events: EventEntity[] = [];
  addons: AddonEntity[] = [];
  upgrades: MasterVersion[] = [];
  clusterBindings: SimpleClusterBinding[] = [];
  bindings: SimpleBinding[] = [];
  private _unsubscribe: Subject<any> = new Subject();
  private _user: MemberEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _clusterService: ClusterService,
    private readonly _matDialog: MatDialog,
    private readonly _datacenterService: DatacenterService,
    private readonly _appConfigService: AppConfigService,
    private readonly _node: NodeService,
    private readonly _userService: UserService,
    private readonly _api: ApiService,
    private readonly _rbacService: RBACService,
    private readonly _notificationService: NotificationService,
    readonly settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.config = this._appConfigService.getConfig();
    this.projectID = this._route.snapshot.paramMap.get('projectID');
    const clusterID = this._route.snapshot.paramMap.get('clusterName');
    const seedDCName = this._route.snapshot.paramMap.get('seedDc');

    this._userService.loggedInUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService
      .currentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));

    combineLatest([
      this._datacenterService.getDatacenter(seedDCName),
      this._clusterService.cluster(this.projectID, clusterID, seedDCName),
    ])
      .pipe(
        switchMap(([seedDatacenter, cluster]) => {
          this.datacenter = seedDatacenter;
          this.cluster = cluster;

          return this._datacenterService.getDatacenter(cluster.spec.cloud.dc);
        })
      )
      .pipe(
        switchMap(datacenter => {
          this.nodeDc = datacenter;

          return combineLatest([
            this._clusterService.sshKeys(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.health(this.projectID, this.cluster.id, this.datacenter.metadata.name),
            this._clusterService.events(this.projectID, this.cluster.id, this.datacenter.metadata.name),
          ]);
        })
      )
      .pipe(
        switchMap(([keys, health, events]) => {
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
          const reload$ = []
            .concat(
              this._canReloadVersions()
                ? this._clusterService.upgrades(this.projectID, this.cluster.id, this.datacenter.metadata.name)
                : of([])
            )
            .concat(
              this._canReloadBindings()
                ? [
                    this._rbacService.getClusterBindings(
                      this.cluster.id,
                      this.datacenter.metadata.name,
                      this.projectID
                    ),
                    this._rbacService.getBindings(this.cluster.id, this.datacenter.metadata.name, this.projectID),
                  ]
                : [of([]), of([])]
            )
            .concat(
              this._canReloadNodes()
                ? [
                    this._clusterService.addons(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                    this._clusterService.nodes(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                    this._api.getNodeDeployments(this.cluster.id, this.datacenter.metadata.name, this.projectID),
                    this._clusterService.metrics(this.projectID, this.cluster.id, this.datacenter.metadata.name),
                  ]
                : [of([]), of([]), of([]), of([])]
            );

          return combineLatest(reload$);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        ([upgrades, clusterBindings, bindings, addons, nodes, nodeDeployments, metrics]: [
          MasterVersion[],
          ClusterBinding[],
          Binding[],
          AddonEntity[],
          NodeEntity[],
          NodeDeployment[],
          ClusterMetrics
        ]) => {
          this.addons = addons;
          this.nodes = nodes;
          this.nodeDeployments = nodeDeployments;
          this.metrics = metrics;
          this.isNodeDeploymentLoadFinished = true;
          this.upgrades = upgrades;
          this.clusterBindings = this.createSimpleClusterBinding(clusterBindings);
          this.bindings = this.createSimpleBinding(bindings);
        },
        error => {
          if (error.status === 404) {
            this._router.navigate(['404']);
          }
        }
      );
  }

  private _canReloadVersions(): boolean {
    return (
      this.cluster &&
      this.health &&
      HealthState.isUp(this.health.apiserver) &&
      HealthState.isUp(this.health.machineController)
    );
  }

  private _canReloadBindings(): boolean {
    return this.cluster && HealthEntity.allHealthy(this.health) && this.isRBACEnabled();
  }

  private _canReloadNodes(): boolean {
    return this.cluster && HealthEntity.allHealthy(this.health);
  }

  getProvider(provider: string): string {
    return provider === 'google' ? 'gcp' : provider;
  }

  isAddNodeDeploymentsEnabled(): boolean {
    return (
      this.isClusterRunning &&
      MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'nodeDeployments', Permission.Create)
    );
  }

  createSimpleClusterBinding(bindings: ClusterBinding[]): SimpleClusterBinding[] {
    const clusterBindingArray = [];
    bindings.forEach(binding => {
      if (binding.subjects) {
        binding.subjects.map(subject => {
          clusterBindingArray.push({
            name: subject.name,
            role: binding.roleRefName,
            kind: subject.kind,
          });
        });
      }
    });
    return clusterBindingArray;
  }

  createSimpleBinding(bindings: Binding[]): SimpleBinding[] {
    const bindingArray = [];
    bindings.forEach(binding => {
      if (binding.subjects) {
        binding.subjects.map(subject => {
          bindingArray.push({
            name: subject.name,
            role: binding.roleRefName,
            namespace: binding.namespace,
            kind: subject.kind,
          });
        });
      }
    });
    return bindingArray;
  }

  addNode(): void {
    this._node
      .showNodeDeploymentCreateDialog(this.nodes.length, this.cluster, this.projectID, this.datacenter)
      .pipe(first())
      .subscribe(isConfirmed => {
        if (isConfirmed) {
          this._clusterService.onClusterUpdate.next();
        }
      });
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'clusters', Permission.Delete);
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe(deleted => {
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

  getDownloadURL(): Observable<string> {
    if (!this.isClusterAPIRunning) {
      return of('');
    }

    return this.settings.adminSettings.pipe(
      switchMap(settings =>
        iif(
          () => settings.enableOIDCKubeconfig,
          this._userService.loggedInUser.pipe(
            map((user: MemberEntity) =>
              this._api.getShareKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id, user.id)
            )
          ),
          of(this._api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id))
        )
      )
    );
  }

  getProxyURL(): string {
    return this.cluster.type === ClusterType.OpenShift
      ? this._api.getOpenshiftProxyURL(this.projectID, this.datacenter.metadata.name, this.cluster.id)
      : this._api.getDashboardProxyURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'clusters', Permission.Edit);
  }

  isOpenshiftCluster(): boolean {
    return this.cluster.type === ClusterType.OpenShift;
  }

  editCluster(): void {
    const modal = this._matDialog.open(EditClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  isSSHKeysEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'sshKeys', Permission.Delete);
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe(isChanged => {
        if (isChanged) {
          this._clusterService.onClusterUpdate.next();
        }
      });
  }

  isRevokeTokenEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'clusters', Permission.Edit);
  }

  revokeToken(): void {
    const dialogRef = this._matDialog.open(RevokeTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  handleAddonCreation(addon: AddonEntity): void {
    this._clusterService
      .createAddon(addon, this.projectID, this.cluster.id, this.datacenter.metadata.name)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(
          `The <strong>${addon.name}</strong> addon was added to the <strong>${this.cluster.name}</strong> cluster`
        );
      });
  }

  handleAddonEdition(addon: AddonEntity): void {
    this._clusterService
      .editAddon(addon, this.projectID, this.cluster.id, this.datacenter.metadata.name)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`The <strong>${addon.name}</strong> addon was updated`);
      });
  }

  handleAddonDeletion(addon: AddonEntity): void {
    this._clusterService
      .deleteAddon(addon.id, this.projectID, this.cluster.id, this.datacenter.metadata.name)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(
          `The <strong>${addon.name}</strong> addon was removed from the <strong>${this.cluster.name}</strong> cluster`
        );
      });
  }

  reloadAddons(): void {
    if (this.projectID && this.cluster && this.datacenter) {
      this._clusterService
        .addons(this.projectID, this.cluster.id, this.datacenter.metadata.name)
        .pipe(first())
        .subscribe(addons => {
          this.addons = addons;
        });
    }
  }

  getConnectName(): string {
    return ClusterEntity.isOpenshiftType(this.cluster) ? 'Open Console' : 'Open Dashboard';
  }

  isRBACEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'rbac', Permission.View);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isShareConfigEnabled(): Observable<boolean> {
    return this.settings.adminSettings.pipe(
      map(settings => !!this.config.share_kubeconfig && !settings.enableOIDCKubeconfig)
    );
  }
}
