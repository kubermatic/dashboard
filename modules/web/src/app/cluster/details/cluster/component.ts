// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {EditProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/component';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {DynamicModule} from '@app/dynamic/module-registry';
import {AddonService} from '@core/services/addon';
import {ApplicationService} from '@core/services/application';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {MLAService} from '@core/services/mla';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {PathParam} from '@core/services/params';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Addon} from '@shared/entity/addon';
import {Application} from '@shared/entity/application';
import {
  CNIPlugin,
  CNIPluginVersions,
  Cluster,
  ExternalCCMMigrationStatus,
  IPFamily,
  MasterVersion,
  Provider,
  getExternalCCMMigrationStatusMessage,
} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {Health, HealthState, HealthType} from '@shared/entity/health';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {ClusterMetrics} from '@shared/entity/metrics';
import {AlertmanagerConfig, RuleGroup} from '@shared/entity/mla';
import {Node} from '@shared/entity/node';
import {Constraint, GatekeeperConfig} from '@shared/entity/opa';
import {AdminSettings} from '@shared/entity/settings';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {
  HealthStatus,
  StatusMassage,
  getClusterHealthStatus,
  isClusterAPIRunning,
  isClusterRunning,
  isOPARunning,
} from '@shared/utils/health-status';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Observable, Subject, combineLatest, iif, of} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {coerce, compare} from 'semver';
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
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _seedSettings: SeedSettings;

  @ViewChild('quotaWidget') quotaWidget: TemplateRef<QuotaWidgetComponent>;

  readonly HealthType = HealthType;
  readonly IPFamily = IPFamily;
  readonly clusterDeletionTooltip = 'Cluster is being deleted';
  readonly isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  adminSettings: AdminSettings;
  externalCCMMigrationStatus = ExternalCCMMigrationStatus;
  cluster: Cluster;
  nodeDc: Datacenter;
  seed: string;
  sshKeys: SSHKey[] = [];
  nodes: Node[] = [];
  machineDeployments: MachineDeployment[];
  areMachineDeploymentsInitialized = false;
  isClusterRunning = false;
  isClusterAPIRunning = false;
  isOPARunning = false;
  healthStatus: HealthStatus;
  health: Health;
  projectID: string;
  metrics: ClusterMetrics;
  events: Event[] = [];
  addons: Addon[] = [];
  applications: Application[] = [];
  upgrades: MasterVersion[] = [];
  cniVersions: string[] = [];
  constraints: Constraint[] = [];
  gatekeeperConfig: GatekeeperConfig;
  alertmanagerConfig: AlertmanagerConfig;
  ruleGroups: RuleGroup[];
  showTerminal = false;
  onExpandChange$ = new EventEmitter<boolean>();
  isDualStackNetworkSelected: boolean;

  get admissionPlugins(): string[] {
    return Object.keys(AdmissionPlugin);
  }

  get isDeletingState(): boolean {
    return this.healthStatus?.message === StatusMassage?.Deleting;
  }

  get isKubernetesDashboardHealthy(): boolean {
    return this.cluster?.spec?.kubernetesDashboard?.enabled && this.health?.kubernetesDashboard === HealthState.Up;
  }

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _clusterService: ClusterService,
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _addonService: AddonService,
    private readonly _matDialog: MatDialog,
    private readonly _datacenterService: DatacenterService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _opaService: OPAService,
    private readonly _mlaService: MLAService,
    private readonly _applicationService: ApplicationService,
    private readonly _dialogModeService: DialogModeService,
    readonly settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.projectID = this._route.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterID = this._route.snapshot.paramMap.get(PathParam.ClusterID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this.settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this.adminSettings = settings));

    this._clusterService
      .cluster(this.projectID, clusterID)
      .pipe(
        switchMap(cluster => {
          this.cluster = cluster;
          this.isDualStackNetworkSelected = Cluster.isDualStackNetworkSelected(cluster);
          return this._datacenterService.getDatacenter(cluster.spec.cloud.dc);
        })
      )
      .pipe(
        switchMap(datacenter => {
          this.nodeDc = datacenter;
          this.seed = datacenter.spec.seed;

          return combineLatest([
            this._clusterService.sshKeys(this.projectID, this.cluster.id),
            this._clusterService.health(this.projectID, this.cluster.id),
            this._clusterService.events(this.projectID, this.cluster.id),
            this._datacenterService.seedSettings(this.seed),
          ]);
        })
      )
      .pipe(
        switchMap(([keys, health, events, seedSettings]) => {
          this.sshKeys = _.sortBy(keys, k => k.name.toLowerCase());
          this.health = health;
          this.events = events;
          this._seedSettings = seedSettings;
          this.isClusterAPIRunning = isClusterAPIRunning(this.cluster, health);
          this.isClusterRunning = isClusterRunning(this.cluster, health);
          this.healthStatus = getClusterHealthStatus(this.cluster, health);
          this.isOPARunning = isOPARunning(this.cluster, health);
          this.onExpandChange$.next(!this.isClusterRunning);

          // Conditionally create an array of observables to use for 'combineLatest' operator.
          // In case real observable should not be returned, observable emitting empty array will be added to the array.
          const reload$ = []
            .concat(
              this._canReloadVersions()
                ? [
                    this._clusterService.upgrades(this.projectID, this.cluster.id),
                    this._clusterService.cniVersions(this.projectID, this.cluster.id),
                  ]
                : [of([] as MasterVersion[]), of({} as CNIPluginVersions)]
            )
            .concat(
              this.isClusterRunning
                ? [
                    this._addonService.list(this.projectID, this.cluster.id),
                    this._clusterService.nodes(this.projectID, this.cluster.id).pipe(
                      tap(nodes => {
                        this.nodes = nodes;
                      })
                    ),
                    this._machineDeploymentService.list(this.cluster.id, this.projectID).pipe(
                      tap(machineDeployments => {
                        this.machineDeployments = machineDeployments;
                        this.areMachineDeploymentsInitialized = true;
                      })
                    ),
                    this.nodes.length > 0
                      ? this._clusterService.metrics(this.projectID, this.cluster.id)
                      : of<ClusterMetrics>({} as ClusterMetrics),
                    this._applicationService.list(this.projectID, this.cluster.id),
                  ]
                : [
                    of([] as Addon[]),
                    of([] as Node[]),
                    of([] as MachineDeployment[]),
                    of({} as ClusterMetrics),
                    of([] as Application[]),
                  ]
            )
            .concat(
              this.isClusterRunning && this.isMLAEnabled()
                ? [
                    this._mlaService.alertmanagerConfig(this.projectID, this.cluster.id),
                    this._mlaService.ruleGroups(this.projectID, this.cluster.id),
                  ]
                : [of([]), of([] as RuleGroup[])]
            )
            .concat(
              this.isClusterRunning && this.isOPARunning && this.cluster.spec.opaIntegration?.enabled
                ? [
                    this._opaService.constraints(this.projectID, this.cluster.id),
                    this._opaService.gatekeeperConfig(this.projectID, this.cluster.id),
                  ]
                : [of([] as Constraint[]), of({} as GatekeeperConfig)]
            ) as [
            Observable<MasterVersion[]>,
            Observable<CNIPluginVersions>,
            Observable<Addon[]>,
            Observable<Node[]>,
            Observable<MachineDeployment[]>,
            Observable<ClusterMetrics>,
            Observable<Application[]>,
            Observable<AlertmanagerConfig>,
            Observable<RuleGroup[]>,
            Observable<Constraint[]>,
            Observable<GatekeeperConfig>,
          ];

          return combineLatest(reload$);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: ([
          upgrades,
          cniVersions,
          addons,
          _nodes,
          _machineDeployments,
          metrics,
          applications,
          alertmanagerConfig,
          ruleGroups,
          constraints,
          gatekeeperConfig,
        ]: [
          MasterVersion[],
          CNIPluginVersions,
          Addon[],
          Node[],
          MachineDeployment[],
          ClusterMetrics,
          Application[],
          AlertmanagerConfig,
          RuleGroup[],
          Constraint[],
          GatekeeperConfig,
        ]) => {
          this.addons = addons;
          this.metrics = metrics;
          this.applications = applications;
          this.alertmanagerConfig = alertmanagerConfig;
          this.ruleGroups = ruleGroups;
          this.upgrades = _.isEmpty(upgrades) ? [] : upgrades;
          this.cniVersions = _.isEmpty(cniVersions)
            ? []
            : cniVersions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
          this.constraints = constraints;
          this.gatekeeperConfig = gatekeeperConfig;
        },
        error: error => {
          const errorCodeNotFound = 404;
          if (error.status === errorCodeNotFound) {
            this._router.navigate(['404']);
          }
        },
      });
  }

  getProvider(provider: string): string {
    return provider === 'google' ? 'gcp' : provider;
  }

  goBack(): void {
    this._router.navigate(['/projects/' + this.projectID + '/clusters']);
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Delete);
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(filter(deleted => deleted))
      .pipe(take(1))
      .subscribe(_ => this.goBack());
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
    modal.componentInstance.projectID = this.projectID;
  }

  getObservable(): Observable<string> {
    return this.getDownloadURL().pipe(take(1));
  }

  onNext(url: string) {
    window.open(url, '_blank');
  }

  getDownloadURL(): Observable<string> {
    return this.settingsService.adminSettings.pipe(
      switchMap(settings =>
        iif(
          () => settings.enableOIDCKubeconfig,
          this._userService.currentUser.pipe(
            map((user: Member) =>
              this._clusterService.getShareKubeconfigURL(this.projectID, this.seed, this.cluster.id, user.id)
            )
          ),
          of(this._clusterService.getKubeconfigURL(this.projectID, this.cluster.id))
        )
      )
    );
  }

  getProxyURL(): string {
    return this._clusterService.getDashboardProxyURL(this.projectID, this.cluster.id);
  }

  getExternalCCMMigrationStatus(): string {
    if (!this.cluster || !this.cluster.status) {
      return '';
    }

    return _.startCase(this.cluster.status.externalCCMMigration);
  }

  getExternalCCMMigrationStatusMessage(): string {
    if (!this.cluster || !this.cluster.status) {
      return '';
    }

    return getExternalCCMMigrationStatusMessage(this.cluster.status.externalCCMMigration);
  }

  startExternalCCMMigration(): void {
    if (
      !this.cluster ||
      !this.cluster.status ||
      this.cluster.status.externalCCMMigration !== ExternalCCMMigrationStatus.Supported
    ) {
      return;
    }

    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'External CCM Migration',
        message: `Start external CCM migration procedure of ${this.cluster.name} cluster?`,
        confirmLabel: 'Start',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.startExternalCCMMigration(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ =>
        this._notificationService.success(`Started external CCM migration procedure of ${this.cluster.name} cluster`)
      );
  }

  isLoaded(): boolean {
    return this.cluster && (Cluster.getProvider(this.cluster) === Provider.kubeAdm || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  editCluster(): void {
    this._dialogModeService.isEditDialog = true;
    const modal = this._matDialog.open(EditClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  editProviderSettings(): void {
    this._dialogModeService.isEditDialog = true;
    const modal = this._matDialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  isSSHKeysEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(take(1))
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
    dialogRef.componentInstance.projectID = this.projectID;
    this._dialogModeService.isEditDialog = true;
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  handleAddonCreation(addon: Addon): void {
    this._addonService
      .add(addon, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Added the ${addon.name} addon to the ${this.cluster.name} cluster`);
      });
  }

  handleAddonEdition(addon: Addon): void {
    this._addonService
      .patch(addon, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Updated the ${addon.name} addon`);
      });
  }

  handleAddonDeletion(addon: Addon): void {
    this._addonService
      .delete(addon.id, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Deleting the ${addon.name} addon from the ${this.cluster.name} cluster`);
      });
  }

  reloadAddons(): void {
    if (this.projectID && this.cluster) {
      this._addonService
        .list(this.projectID, this.cluster.id)
        .pipe(take(1))
        .subscribe(addons => (this.addons = addons));
    }
  }

  onApplicationAdded(application: Application): void {
    this._applicationService
      .add(application, this.projectID, this.cluster.id)
      .pipe(take(1))
      .subscribe(() => {
        this.reloadApplications();
        this._notificationService.success(
          `Added the ${application.name} application to the ${this.cluster.name} cluster`
        );
      });
  }

  onApplicationUpdated(application: Application): void {
    this._applicationService
      .put(application, this.projectID, this.cluster.id)
      .pipe(take(1))
      .subscribe(() => {
        this.reloadApplications();
        this._notificationService.success(`Updated the ${application.name} application`);
      });
  }

  onApplicationDeleted(application: Application): void {
    this._applicationService
      .delete(application, this.projectID, this.cluster.id)
      .pipe(take(1))
      .subscribe(() => {
        this.reloadApplications();
        this._notificationService.success(
          `Deleting the ${application.name} application from the ${this.cluster.name} cluster`
        );
      });
  }

  reloadApplications(): void {
    if (this.projectID && this.cluster) {
      this._applicationService
        .list(this.projectID, this.cluster.id)
        .pipe(take(1))
        .subscribe(applications => (this.applications = applications));
    }
  }

  isRBACEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'rbac', Permission.View);
  }

  isMLAEnabledInSeed(): boolean {
    return this._seedSettings?.mla?.user_cluster_mla_enabled;
  }

  isMLAEnabled(): boolean {
    return (
      this.isMLAEnabledInSeed() &&
      !!this.cluster.spec.mla &&
      (!!this.cluster.spec.mla.loggingEnabled || !!this.cluster.spec.mla.monitoringEnabled)
    );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isAdmissionPluginEnabled(plugin: string): boolean {
    return this.cluster?.spec?.admissionPlugins?.includes(plugin) || false;
  }

  getAdmissionPluginName(plugin: string): string {
    return AdmissionPluginUtils.getPluginName(plugin);
  }

  isHavingCNI(): boolean {
    return !!this.cluster?.spec?.cniPlugin && this.cluster?.spec?.cniPlugin?.type !== CNIPlugin.None;
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.projectId = this.projectID;
    component.showQuotaWidgetDetails = true;
    component.showIcon = true;
  }

  toggleTerminal(): void {
    if (!this.isClusterRunning) {
      return;
    }
    this.showTerminal = !this.showTerminal;
  }

  isWebTerminalEnabled(): boolean {
    if (this.machineDeployments?.length) {
      return (
        this.machineDeployments.some(
          (md: MachineDeployment) => !md.deletionTimestamp && md.status.availableReplicas > 0
        ) && !this.isDeletingState
      );
    }
    return false;
  }

  getWebTerminalTooltip(): string {
    if (this.isDeletingState) {
      return this.clusterDeletionTooltip;
    }

    if (!this.isWebTerminalEnabled()) {
      return 'At least one machine should be running to enable Web Terminal';
    }
    return '';
  }

  getOpenDashboardTooltip(): string {
    if (this.isDeletingState) {
      return this.clusterDeletionTooltip;
    }
    if (!this.isKubernetesDashboardHealthy) {
      return this.cluster?.spec?.kubernetesDashboard?.enabled
        ? 'Kubernetes Dashboard is not running'
        : 'Kubernetes Dashboard is disabled';
    }
    return '';
  }

  private _canReloadVersions(): boolean {
    return (
      this.cluster &&
      this.health &&
      HealthState.isUp(this.health.apiserver) &&
      (Cluster.getProvider(this.cluster) === Provider.Edge || HealthState.isUp(this.health.machineController))
    );
  }
}
