// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ApiService} from '@core/services/api/service';
import {ClusterService} from '@core/services/cluster/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {NotificationService} from '@core/services/notification/service';
import {PathParam} from '@core/services/params/service';
import {RBACService} from '@core/services/rbac/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {Addon} from '@shared/entity/addon';
import {Cluster, ClusterType, getClusterProvider, MasterVersion} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {Health, HealthState} from '@shared/entity/health';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {ClusterMetrics} from '@shared/entity/metrics';
import {Binding, ClusterBinding, SimpleBinding, SimpleClusterBinding} from '@shared/entity/rbac';
import {SSHKey} from '@shared/entity/ssh-key';
import {Config, GroupConfig} from '@shared/model/Config';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';
import {ClusterHealthStatus} from '@shared/utils/health-status/cluster-health-status';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {combineLatest, iif, Observable, of, Subject} from 'rxjs';
import {filter, first, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {NodeService} from '../services/node.service';
import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation/component';
import {EditClusterComponent} from './edit-cluster/component';
import {EditSSHKeysComponent} from './edit-sshkeys/component';
import {RevokeTokenComponent} from './revoke-token/component';
import {ShareKubeconfigComponent} from './share-kubeconfig/component';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
  cluster: Cluster;
  nodeDc: Datacenter;
  seed: string;
  sshKeys: SSHKey[] = [];
  machineDeployments: MachineDeployment[];
  isClusterRunning = false;
  isClusterAPIRunning = false;
  clusterHealthStatus: ClusterHealthStatus;
  health: Health;
  config: Config = {share_kubeconfig: false};
  projectID: string;
  metrics: ClusterMetrics;
  events: Event[] = [];
  addons: Addon[] = [];
  upgrades: MasterVersion[] = [];
  clusterBindings: SimpleClusterBinding[] = [];
  bindings: SimpleBinding[] = [];
  private _unsubscribe: Subject<any> = new Subject();
  private _user: Member;
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
    this.projectID = this._route.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterID = this._route.snapshot.paramMap.get(PathParam.ClusterID);
    this.seed = this._route.snapshot.paramMap.get(PathParam.SeedDC);

    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._clusterService
      .cluster(this.projectID, clusterID)
      .pipe(
        switchMap(cluster => {
          this.cluster = cluster;
          return this._datacenterService.getDatacenter(cluster.spec.cloud.dc);
        })
      )
      .pipe(
        switchMap(datacenter => {
          this.nodeDc = datacenter;

          return combineLatest([
            this._clusterService.sshKeys(this.projectID, this.cluster.id),
            this._clusterService.health(this.projectID, this.cluster.id),
            this._clusterService.events(this.projectID, this.cluster.id),
          ]);
        })
      )
      .pipe(
        switchMap(([keys, health, events]) => {
          this.sshKeys = _.sortBy(keys, k => k.name.toLowerCase());
          this.health = health;
          this.events = events;
          this.isClusterAPIRunning = ClusterHealthStatus.isClusterAPIRunning(this.cluster, health);
          this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
          this.clusterHealthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);

          // Conditionally create an array of observables to use for 'combineLatest' operator.
          // In case real observable should not be returned, observable emitting empty array will be added to the array.
          const reload$ = []
            .concat(this._canReloadVersions() ? this._clusterService.upgrades(this.projectID, this.cluster.id) : of([]))
            .concat(
              this._canReloadBindings()
                ? [
                    this._rbacService.getClusterBindings(this.cluster.id, this.seed, this.projectID),
                    this._rbacService.getBindings(this.cluster.id, this.seed, this.projectID),
                  ]
                : [of([]), of([])]
            )
            .concat(
              this._canReloadNodes()
                ? [
                    this._clusterService.addons(this.projectID, this.cluster.id, this.seed),
                    this._api.getMachineDeployments(this.cluster.id, this.seed, this.projectID),
                    this._clusterService.metrics(this.projectID, this.cluster.id),
                  ]
                : [of([]), of([]), of([]), of([])]
            );

          return combineLatest(reload$);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        ([upgrades, clusterBindings, bindings, addons, machineDeployments, metrics]: [
          MasterVersion[],
          ClusterBinding[],
          Binding[],
          Addon[],
          MachineDeployment[],
          ClusterMetrics
        ]) => {
          this.addons = addons;
          this.machineDeployments = machineDeployments;
          this.metrics = metrics;
          this.upgrades = _.isEmpty(upgrades) ? [] : upgrades;
          this.clusterBindings = this.createSimpleClusterBinding(clusterBindings);
          this.bindings = this.createSimpleBinding(bindings);
        },
        error => {
          const errorCodeNotFound = 404;
          if (error.status === errorCodeNotFound) {
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
    return this.cluster && Health.allHealthy(this.health) && this.isRBACEnabled();
  }

  private _canReloadNodes(): boolean {
    return this.cluster && Health.allHealthy(this.health);
  }

  getProvider(provider: string): string {
    return provider === 'google' ? 'gcp' : provider;
  }

  isAddMachineDeploymentsEnabled(): boolean {
    return (
      this.isClusterRunning &&
      MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Create)
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
      .showMachineDeploymentCreateDialog(this.cluster, this.projectID, this.seed)
      .pipe(take(1))
      .subscribe(
        _ => this._clusterService.onClusterUpdate.next(),
        _ => this._notificationService.error('There was an error during node deployment creation.')
      );
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Delete);
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(filter(deleted => deleted))
      .pipe(take(1))
      .subscribe(_ => this._router.navigate(['/projects/' + this.projectID + '/clusters']));
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
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
          this._userService.currentUser.pipe(
            map((user: Member) => this._api.getShareKubeconfigURL(this.projectID, this.seed, this.cluster.id, user.id))
          ),
          of(this._api.getKubeconfigURL(this.projectID, this.seed, this.cluster.id))
        )
      )
    );
  }

  getProxyURL(): string {
    return this.cluster.type === ClusterType.OpenShift
      ? this._api.getOpenshiftProxyURL(this.projectID, this.seed, this.cluster.id)
      : this._api.getDashboardProxyURL(this.projectID, this.seed, this.cluster.id);
  }

  isLoaded(): boolean {
    return this.cluster && (getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  isOpenshiftCluster(): boolean {
    return this.cluster.type === ClusterType.OpenShift;
  }

  editCluster(): void {
    const modal = this._matDialog.open(EditClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
    modal.componentInstance.projectID = this.projectID;
  }

  isSSHKeysEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
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
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  revokeToken(): void {
    const dialogRef = this._matDialog.open(RevokeTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.seed = this.seed;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  handleAddonCreation(addon: Addon): void {
    this._clusterService
      .createAddon(addon, this.projectID, this.cluster.id, this.seed)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(
          `The <strong>${addon.name}</strong> addon was added to the <strong>${this.cluster.name}</strong> cluster`
        );
      });
  }

  handleAddonEdition(addon: Addon): void {
    this._clusterService
      .editAddon(addon, this.projectID, this.cluster.id, this.seed)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`The <strong>${addon.name}</strong> addon was updated`);
      });
  }

  handleAddonDeletion(addon: Addon): void {
    this._clusterService
      .deleteAddon(addon.id, this.projectID, this.cluster.id, this.seed)
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
    if (this.projectID && this.cluster && this.seed) {
      this._clusterService
        .addons(this.projectID, this.cluster.id, this.seed)
        .pipe(first())
        .subscribe(addons => {
          this.addons = addons;
        });
    }
  }

  getConnectName(): string {
    return Cluster.isOpenshiftType(this.cluster) ? 'Open Console' : 'Open Dashboard';
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

  getAdmissionPlugins(): string {
    return AdmissionPluginUtils.getJoinedPluginNames(this.cluster.spec.admissionPlugins);
  }
}
