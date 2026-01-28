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

import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {DynamicModule} from '@app/dynamic/module-registry';
import {BackupStorageLocation} from '@app/shared/entity/backup';
import {NODEPORTS_IPRANGES_SUPPORTED_PROVIDERS, NodeProvider} from '@app/shared/model/NodeProviderConstants';
import {BSLListState} from '@app/wizard/step/cluster/component';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {
  AuditLoggingWebhookBackend,
  AuditPolicyPreset,
  Cluster,
  ClusterPatch,
  ClusterSpecPatch,
  ContainerRuntime,
  EventRateLimitConfig,
  EventRateLimitConfigItem,
  ExposeStrategy,
  InternalClusterSpecAnnotations,
  NetworkRanges,
  ProviderSettingsPatch,
} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {AdminSettings, StaticLabel} from '@shared/entity/settings';
import {KeyValueEntry} from '@shared/types/common';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {
  CLUSTER_DEFAULT_NODE_SELECTOR_HINT,
  CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE,
  CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP,
  generateEncryptionKey,
} from '@shared/utils/cluster';
import {getEditionVersion} from '@shared/utils/common';
import {AsyncValidators} from '@shared/validators/async.validators';
import {IPV4_IPV6_CIDR_PATTERN} from '@shared/validators/others';
import {KmValidators} from '@shared/validators/validators';
import _ from 'lodash';
import {Observable, Subject} from 'rxjs';
import {map, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Name = 'name',
  ContainerRuntime = 'containerRuntime',
  AuditLogging = 'auditLogging',
  AuditPolicyPreset = 'auditPolicyPreset',
  AuditWebhookBackend = 'auditWebhookBackend',
  AuditWebhookBackendInitialBackoff = 'auditWebhookBackendInitialBackoff',
  AuditWebhookBackendSecretName = 'auditWebhookBackendSecretName',
  AuditWebhookBackendSecretNamespace = 'auditWebhookBackendSecretNamespace',
  Labels = 'labels',
  Annotations = 'annotations',
  AdmissionPlugins = 'admissionPlugins',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
  EventRateLimitConfig = 'eventRateLimitConfig',
  OPAIntegration = 'opaIntegration',
  KyvernoIntegration = 'kyvernoIntegration',
  Konnectivity = 'konnectivity',
  MLALogging = 'loggingEnabled',
  MLAMonitoring = 'monitoringEnabled',
  KubeLB = 'kubelb',
  KubeLBUseLoadBalancerClass = 'kubelbUseLoadBalancerClass',
  KubeLBEnableGatewayAPI = 'kubelbEnableGatewayAPI',
  KubernetesDashboardEnabled = 'kubernetesDashboardEnabled',
  APIServerAllowedIPRanges = 'apiServerAllowedIPRanges',
  DisableCSIDriver = 'disableCSIDriver',
  ClusterBackup = 'clusterBackup',
  RouterReconciliation = 'routerReconciliation',
  BackupStorageLocation = 'backupStorageLocation',
  NodePortsAllowedIPRanges = 'nodePortsAllowedIPRanges',
  EncryptionAtRest = 'encryptionAtRest',
  EncryptionAtRestKey = 'encryptionAtRestKey',
}

@Component({
  selector: 'km-edit-cluster',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class EditClusterComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  datacenter: Datacenter;
  containerRuntime = ContainerRuntime;
  admissionPlugin = AdmissionPlugin;
  form: FormGroup;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  podNodeSelectorAdmissionPluginConfig: Record<string, string>;
  eventRateLimitConfig: EventRateLimitConfig;
  admissionPlugins: string[] = [];
  providerSettingsPatch: ProviderSettingsPatch = {
    isValid: true,
    cloudSpecPatch: {},
  };
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  clusterDefaultNodeSelectorNamespace: KeyValueEntry;
  adminStaticLabels: StaticLabel[];
  apiServerAllowedIPRanges: string[] = [];
  editionVersion: string = getEditionVersion();
  isKubeLBEnforced = false;
  isKubeLBEnabled = false;
  isCSIDriverDisabled = false;
  enforcedAuditWebhookSettings: AuditLoggingWebhookBackend;
  backupStorageLocationsList: BackupStorageLocation[];
  backupStorageLocationLabel: BSLListState = BSLListState.Ready;
  isAllowedIPRangeSupported: boolean;
  readonly isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE = CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP = CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_HINT = CLUSTER_DEFAULT_NODE_SELECTOR_HINT;
  readonly Controls = Controls;
  readonly AuditPolicyPreset = AuditPolicyPreset;
  readonly ipv4AndIPv6CidrRegex = IPV4_IPV6_CIDR_PATTERN;
  readonly NodeProvider = NodeProvider;
  private readonly _nameMinLen = 3;
  private readonly ENCRYPTION_KEY_ANNOTATION = 'kubermatic.io/encryption-key';
  private _settings: AdminSettings;
  private _seedSettings: SeedSettings;
  private _unsubscribe = new Subject<void>();
  private _provider: string;

  get isKubernetesDashboardEnable(): boolean {
    return this._settings.enableDashboard;
  }

  get isclusterBackupEnabled(): boolean {
    return this._settings.enableClusterBackups;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<EditClusterComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.cluster.labels) as Record<string, string>;
    this.annotations = _.cloneDeep(this.cluster.annotations) as Record<string, string>;
    this.podNodeSelectorAdmissionPluginConfig = _.cloneDeep(
      this.cluster.spec.podNodeSelectorAdmissionPluginConfig
    ) as Record<string, string>;
    this.eventRateLimitConfig = _.cloneDeep(this.cluster.spec.eventRateLimitConfig);
    this.apiServerAllowedIPRanges = this.cluster.spec.apiServerAllowedIPRanges?.cidrBlocks;

    this.form = this._builder.group({
      [Controls.Name]: new FormControl(this.cluster.name, [
        Validators.required,
        Validators.minLength(this._nameMinLen),
      ]),
      [Controls.ContainerRuntime]: new FormControl(this.cluster.spec.containerRuntime || ContainerRuntime.Containerd, [
        Validators.required,
      ]),
      [Controls.AuditLogging]: new FormControl(
        !!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled
      ),
      [Controls.AuditPolicyPreset]: new FormControl(this._getAuditPolicyPresetInitialState()),
      [Controls.AuditWebhookBackend]: new FormControl(!!this.cluster.spec.auditLogging?.webhookBackend),
      [Controls.OPAIntegration]: new FormControl(
        !!this.cluster.spec.opaIntegration && this.cluster.spec.opaIntegration.enabled
      ),
      [Controls.KyvernoIntegration]: new FormControl(!!this.cluster.spec.kyverno && this.cluster.spec.kyverno.enabled),
      [Controls.Konnectivity]: new FormControl({
        value: !!this.cluster.spec.clusterNetwork?.konnectivityEnabled,
        disabled: !!this.cluster.spec.clusterNetwork?.konnectivityEnabled,
      }),
      [Controls.MLALogging]: new FormControl(!!this.cluster.spec.mla && this.cluster.spec.mla.loggingEnabled),
      [Controls.MLAMonitoring]: new FormControl(!!this.cluster.spec.mla && this.cluster.spec.mla.monitoringEnabled),
      [Controls.KubeLB]: new FormControl(this.cluster.spec.kubelb?.enabled),
      [Controls.KubeLBUseLoadBalancerClass]: new FormControl(this.cluster.spec.kubelb?.useLoadBalancerClass),
      [Controls.KubeLBEnableGatewayAPI]: new FormControl(this.cluster.spec.kubelb?.enableGatewayAPI),
      [Controls.KubernetesDashboardEnabled]: new FormControl(!!this.cluster.spec.kubernetesDashboard?.enabled),
      [Controls.AdmissionPlugins]: new FormControl(this.cluster.spec.admissionPlugins),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: new FormControl(''),
      [Controls.EventRateLimitConfig]: new FormControl(),
      [Controls.Labels]: new FormControl(null),
      [Controls.Annotations]: new FormControl(null),
      [Controls.APIServerAllowedIPRanges]: new FormControl(this.cluster.spec.apiServerAllowedIPRanges?.cidrBlocks),
      [Controls.DisableCSIDriver]: new FormControl(this.cluster.spec.disableCsiDriver),
      [Controls.ClusterBackup]: new FormControl(!!this.cluster.spec.backupConfig),
      [Controls.RouterReconciliation]: new FormControl(
        this.cluster.annotations?.[InternalClusterSpecAnnotations.SkipRouterReconciliation] === 'true'
      ),
      [Controls.NodePortsAllowedIPRanges]: new FormControl([]),
      [Controls.EncryptionAtRest]: new FormControl(!!this.cluster.spec.encryptionConfiguration?.enabled),
      [Controls.EncryptionAtRestKey]: new FormControl('', [KmValidators.encryptionKey()]),
    });

    if (this.form.get(Controls.ClusterBackup).value) {
      this.form.addControl(
        Controls.BackupStorageLocation,
        this._builder.control(this.cluster.spec?.backupConfig?.backupStorageLocation?.name, Validators.required)
      );
    }
    if (this.form.get(Controls.AuditWebhookBackend).value) {
      this._initAuditWebhookBackendControls(this.cluster.spec?.auditLogging?.webhookBackend);
    }

    this._getCBSL(this.projectID);

    this.form
      .get(Controls.ClusterBackup)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((value: boolean) => {
        if (value) {
          this.form.addControl(Controls.BackupStorageLocation, this._builder.control('', Validators.required));
        } else {
          this.form.removeControl(Controls.BackupStorageLocation);
        }
      });

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      this._settings = settings;
      if (settings.staticLabels) {
        this.adminStaticLabels = settings.staticLabels.filter(label => Object.keys(this.labels).includes(label.key));
      }
      if (this._settings.opaOptions.enabled) {
        this.form.get(Controls.OPAIntegration).setValue(true);
      }
      if (this._settings.opaOptions.enforced) {
        this.form.get(Controls.OPAIntegration).disable();
      }
      this.form.updateValueAndValidity();

      this._enforce(Controls.MLALogging, this._settings.mlaOptions.loggingEnforced);
      this._enforce(Controls.MLAMonitoring, this._settings.mlaOptions.monitoringEnforced);
    });

    this._clusterService.providerSettingsPatchChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(patch => (this.providerSettingsPatch = patch));

    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(
        tap(datacenter => (this.datacenter = datacenter)),
        switchMap(datacenter =>
          this._datacenterService
            .seedSettings(datacenter.spec.seed)
            .pipe(map(seedSettings => ({datacenter, seedSettings})))
        )
      )
      .subscribe(({datacenter, seedSettings}) => {
        this._seedSettings = seedSettings;
        this.isKubeLBEnabled = this._isKubeLBEnabled(datacenter, seedSettings);
        this.isKubeLBEnforced = !!datacenter.spec.kubelb?.enforced;

        // If KubeLB is enforced, we need to enable the kubelb control
        if (this.isKubeLBEnforced) {
          this.form.get(Controls.KubeLB).setValue(true);
        }

        this.isCSIDriverDisabled = datacenter.spec.disableCsiDriver;
        this._provider = datacenter.spec.provider;
        this.isAllowedIPRangeSupported = (NODEPORTS_IPRANGES_SUPPORTED_PROVIDERS as string[]).includes(this._provider);
        if (this.cluster.spec.cloud?.[this._provider]?.nodePortsAllowedIPRanges?.cidrBlocks?.length) {
          this.form
            .get(Controls.NodePortsAllowedIPRanges)
            .setValue(this.cluster.spec.cloud?.[this._provider]?.nodePortsAllowedIPRanges?.cidrBlocks);
        }
        this.enforcedAuditWebhookSettings = datacenter.spec.enforcedAuditWebhookSettings;
        this._enforceAuditWebhookBackendSettings(this.enforcedAuditWebhookSettings);
      });

    this._clusterService
      .getAdmissionPlugins(this.cluster.spec.version)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins));

    this.checkForLegacyAdmissionPlugins();

    this.form
      .get(Controls.AdmissionPlugins)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        const selectedPlugins = this.form.get(Controls.AdmissionPlugins).value;
        if (
          !selectedPlugins.includes(AdmissionPlugin.PodNodeSelector) &&
          !_.isEmpty(this.podNodeSelectorAdmissionPluginConfig)
        ) {
          this.form.get(Controls.PodNodeSelectorAdmissionPluginConfig).reset();
          this.onPodNodeSelectorAdmissionPluginConfigChange(null);
        }
      });

    this.form
      .get(Controls.AuditLogging)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((value: boolean) => {
        if (!value && this.form.get(Controls.AuditWebhookBackend).value) {
          this.form.get(Controls.AuditWebhookBackend).setValue(false);
        }
      });

    this.form
      .get(Controls.AuditWebhookBackend)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((value: boolean) => {
        if (value) {
          this._initAuditWebhookBackendControls();
        } else {
          this.form.removeControl(Controls.AuditWebhookBackendSecretName);
          this.form.removeControl(Controls.AuditWebhookBackendSecretNamespace);
          this.form.removeControl(Controls.AuditWebhookBackendInitialBackoff);
          this.form.updateValueAndValidity();
        }
      });

    const [initialClusterDefaultNodeSelectorKey] =
      this.podNodeSelectorAdmissionPluginConfig?.[this.CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE]?.split('=') ?? [];

    if (initialClusterDefaultNodeSelectorKey && this.labels?.[initialClusterDefaultNodeSelectorKey]) {
      this._handleClusterDefaultNodeSelector(this.podNodeSelectorAdmissionPluginConfig);
    }

    // Handle Encryption at Rest validator changes
    this.form
      .get(Controls.EncryptionAtRest)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(enabled => {
        const EncryptionAtRestControl = this.form.get(Controls.EncryptionAtRestKey);
        const wasEnabled = this.cluster.spec.encryptionConfiguration?.enabled;

        if (enabled && !wasEnabled) {
          EncryptionAtRestControl.setValidators([Validators.required, KmValidators.encryptionKey()]);
        } else {
          EncryptionAtRestControl.clearValidators();
          if (!enabled) {
            EncryptionAtRestControl.setValue('');
          }
        }
        EncryptionAtRestControl.updateValueAndValidity();
      });

    this._cdr.detectChanges();
  }

  generateEncryptionKey(): void {
    const key = generateEncryptionKey();
    this.form.get(Controls.EncryptionAtRestKey).setValue(key);
  }

  isEncryptionActive(): boolean {
    return this.cluster.spec.encryptionConfiguration?.enabled || this.cluster.status?.encryption?.phase === 'Active';
  }

  private _getAuditPolicyPresetInitialState(): AuditPolicyPreset | '' {
    if (!this.cluster.spec.auditLogging) {
      return '';
    }

    return this.cluster.spec.auditLogging.policyPreset
      ? this.cluster.spec.auditLogging.policyPreset
      : AuditPolicyPreset.Custom;
  }

  onLabelsChange(labels: Record<string, string>): void {
    this.labels = labels;
  }

  onAnnotationsChange(annotations: Record<string, string>): void {
    this.annotations = annotations;
  }

  onPodNodeSelectorAdmissionPluginConfigChange(config: Record<string, string>): void {
    this.podNodeSelectorAdmissionPluginConfig = config;

    this._handleClusterDefaultNodeSelector(config);
  }

  onAPIServerAllowIPRangeChange(ips: string[]): void {
    this.apiServerAllowedIPRanges = ips;
  }

  isExposeStrategyLoadBalancer(): boolean {
    return this.cluster.spec.exposeStrategy === ExposeStrategy.loadbalancer;
  }

  checkForLegacyAdmissionPlugins(): void {
    if (this.cluster.spec.usePodNodeSelectorAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodNodeSelector
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }

    if (this.cluster.spec.usePodSecurityPolicyAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }
    this.checkEnforcedFieldsState();
  }

  checkEnforcedFieldsState(): void {
    if (this.datacenter.spec.enforceAuditLogging) {
      this.form.get(Controls.AuditLogging).setValue(true);
      this.form.get(Controls.AuditLogging).disable();
    }

    if (this.datacenter.spec.enforcePodSecurityPolicy) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }

    if (this.datacenter.spec.disableCsiDriver) {
      this.form.get(Controls.DisableCSIDriver).setValue(true);
      this.form.get(Controls.DisableCSIDriver).disable();
    }
  }

  getPluginName(name: string): string {
    return AdmissionPluginUtils.getPluginName(name);
  }

  isPluginEnabled(name: string): boolean {
    return AdmissionPluginUtils.isPluginEnabled(this.form.get(Controls.AdmissionPlugins), name);
  }

  isMLAEnabled(): boolean {
    return this._seedSettings?.mla?.user_cluster_mla_enabled;
  }

  isPodSecurityPolicyEnforced(): boolean {
    return AdmissionPluginUtils.isPodSecurityPolicyEnforced(this.datacenter);
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.OPAIntegration:
        return !!this._settings?.opaOptions?.enforced;
      case Controls.MLALogging:
        return !!this._settings?.mlaOptions?.loggingEnforced;
      case Controls.MLAMonitoring:
        return !!this._settings?.mlaOptions?.monitoringEnforced;
      default:
        return false;
    }
  }

  private _enforce(control: Controls, isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(control).disable();
    } else {
      this.form.get(control).enable();
    }
  }

  private _isKubeLBEnabled(datacenter: Datacenter, seedSettings: SeedSettings): boolean {
    return !!(
      datacenter.spec.kubelb?.enforced ||
      datacenter.spec.kubelb?.enabled ||
      seedSettings?.kubelb?.enableForAllDatacenters
    );
  }

  private _getCBSL(projectID: string): void {
    this.backupStorageLocationLabel = BSLListState.Loading;
    this._clusterBackupService
      .listBackupStorageLocation(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cbslList => {
        this.backupStorageLocationsList = cbslList;
        this.backupStorageLocationLabel = cbslList.length ? BSLListState.Ready : BSLListState.Empty;
      });
  }

  getObservable(): Observable<Cluster> {
    const patch: ClusterPatch = {
      name: this.form.get(Controls.Name).value,
      labels: this.labels,
      annotations: this.annotations,
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
        auditLogging: {
          enabled: this.form.get(Controls.AuditLogging).value,
          policyPreset: this.form.get(Controls.AuditPolicyPreset).value,
          webhookBackend:
            !this.enforcedAuditWebhookSettings && this.form.get(Controls.AuditWebhookBackend).value
              ? {
                  auditWebhookConfig: {
                    name: this.form.get(Controls.AuditWebhookBackendSecretName).value,
                    namespace: this.form.get(Controls.AuditWebhookBackendSecretNamespace).value,
                  },
                  auditWebhookInitialBackoff: this.form.get(Controls.AuditWebhookBackendInitialBackoff).value,
                }
              : null,
        },
        opaIntegration: {
          enabled: this.form.get(Controls.OPAIntegration).value,
        },
        kyverno: {
          enabled: this.form.get(Controls.KyvernoIntegration).value,
        },
        clusterNetwork: {
          konnectivityEnabled: this.form.get(Controls.Konnectivity).value,
        },
        kubernetesDashboard: {
          enabled: this.form.get(Controls.KubernetesDashboardEnabled).value,
        },
        disableCsiDriver: this.form.get(Controls.DisableCSIDriver).value,
        kubelb: {
          enabled: this.form.get(Controls.KubeLB).value,
          useLoadBalancerClass: this.form.get(Controls.KubeLBUseLoadBalancerClass).value,
          enableGatewayAPI: this.form.get(Controls.KubeLBEnableGatewayAPI).value,
        },
        mla: {
          loggingEnabled: this.form.get(Controls.MLALogging).value,
          monitoringEnabled: this.form.get(Controls.MLAMonitoring).value,
        },
        usePodNodeSelectorAdmissionPlugin: null,
        usePodSecurityPolicyAdmissionPlugin: null,
        eventRateLimitConfig: null,
        admissionPlugins: this.form.get(Controls.AdmissionPlugins).value,
        podNodeSelectorAdmissionPluginConfig: this.podNodeSelectorAdmissionPluginConfig,
        containerRuntime: this.form.get(Controls.ContainerRuntime).value,
      } as ClusterSpecPatch,
    } as ClusterPatch;

    if (this.isPluginEnabled(this.admissionPlugin.EventRateLimit)) {
      // Initialize with null values for all limit types to ensure the PATCH request
      // explicitly clears any existing configuration not present in the current form.
      const eventRateLimitConfig: EventRateLimitConfig = {
        namespace: null,
        server: null,
        user: null,
        sourceAndObjects: null,
      };
      const eventRateLimitConfigItems: EventRateLimitConfigItem[] = this.form.get(Controls.EventRateLimitConfig).value
        ?.eventRateLimitConfig;
      if (eventRateLimitConfigItems) {
        eventRateLimitConfigItems.forEach(item => {
          if (item.limitType) {
            eventRateLimitConfig[item.limitType] = {
              qps: item.qps,
              burst: item.burst,
              cacheSize: item.cacheSize,
            };
          }
        });
      }
      patch.spec.eventRateLimitConfig = eventRateLimitConfig;
    }

    if (this.isExposeStrategyLoadBalancer()) {
      patch.spec.apiServerAllowedIPRanges = this.getAPIServerAllowedIPRange();
    }

    if (this.form.get(Controls.ClusterBackup).value) {
      patch.spec.backupConfig = {
        backupStorageLocation: {
          name: this.form.get(Controls.BackupStorageLocation).value,
        },
      };
    } else {
      patch.spec.backupConfig = null;
    }

    this._handleEncryptionConfigurationChanges(patch);

    if (this.form.get(Controls.NodePortsAllowedIPRanges)?.value) {
      patch.spec.cloud[this._provider] = {
        nodePortsAllowedIPRanges: {
          cidrBlocks: this.form.get(Controls.NodePortsAllowedIPRanges).value.tags,
        },
      };
    }

    if (this.datacenter.spec.provider === NodeProvider.OPENSTACK) {
      patch.annotations = {
        ...patch.annotations,
        [InternalClusterSpecAnnotations.SkipRouterReconciliation]: this.form.get(Controls.RouterReconciliation).value
          ? 'true'
          : 'false',
      };
    }

    return this._clusterService.patch(this.projectID, this.cluster.id, patch, true).pipe(take(1));
  }

  onNext(cluster: Cluster): void {
    this._matDialogRef.close(cluster);
    this._clusterService.onClusterUpdate.next();
    this._notificationService.success(`Updated the ${this.cluster.name} cluster`);
  }

  private _handleEncryptionConfigurationChanges(patch: ClusterPatch): void {
    const encryptionEnabled = !!this.form.get(Controls.EncryptionAtRest).value;
    const encryptionKey = this.form.get(Controls.EncryptionAtRestKey).value;
    const wasEnabled = !!this.cluster.spec.encryptionConfiguration?.enabled;

    if (encryptionEnabled !== wasEnabled || (encryptionEnabled && encryptionKey)) {
      patch.spec.encryptionConfiguration = {
        enabled: encryptionEnabled,
      };

      if (encryptionEnabled && encryptionKey) {
        if (!patch.annotations) {
          patch.annotations = {};
        }
        patch.annotations[this.ENCRYPTION_KEY_ANNOTATION] = encryptionKey;
      }
    } else if (wasEnabled) {
      patch.spec.encryptionConfiguration = this.cluster.spec.encryptionConfiguration;
    }
  }

  private _handleClusterDefaultNodeSelector(config: Record<string, string>): void {
    const [currKey, currValue] = config?.[CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE]?.split('=') ?? [];
    this.clusterDefaultNodeSelectorNamespace = [currKey, currValue];
  }

  private getAPIServerAllowedIPRange(): NetworkRanges {
    if (!this.isExposeStrategyLoadBalancer()) {
      return null;
    }
    const apiServerAllowedIPRange = this.form.get(Controls.APIServerAllowedIPRanges).value?.tags;
    return !apiServerAllowedIPRange ? {cidrBlocks: []} : {cidrBlocks: apiServerAllowedIPRange};
  }

  private _initAuditWebhookBackendControls(config?: AuditLoggingWebhookBackend): void {
    if (!this.form.get(Controls.AuditWebhookBackendSecretName)) {
      this.form.addControl(Controls.AuditWebhookBackendSecretName, this._builder.control('', Validators.required));
    }
    if (!this.form.get(Controls.AuditWebhookBackendSecretNamespace)) {
      this.form.addControl(Controls.AuditWebhookBackendSecretNamespace, this._builder.control('', Validators.required));
    }
    if (!this.form.get(Controls.AuditWebhookBackendInitialBackoff)) {
      this.form.addControl(Controls.AuditWebhookBackendInitialBackoff, this._builder.control(''));
    }

    this.form.updateValueAndValidity();

    if (config) {
      this.form.patchValue({
        [Controls.AuditWebhookBackendSecretName]: config?.auditWebhookConfig?.name,
        [Controls.AuditWebhookBackendSecretNamespace]: config?.auditWebhookConfig?.namespace,
        [Controls.AuditWebhookBackendInitialBackoff]: config?.auditWebhookInitialBackoff,
      });
    }
  }

  private _enforceAuditWebhookBackendSettings(auditWebhookBackend?: AuditLoggingWebhookBackend): void {
    if (auditWebhookBackend) {
      if (!this.form.get(Controls.AuditWebhookBackend).value) {
        this.form.get(Controls.AuditWebhookBackend).setValue(true, {emitEvent: false});
        this._initAuditWebhookBackendControls(auditWebhookBackend);
      } else {
        this.form.patchValue({
          [Controls.AuditWebhookBackendSecretName]: auditWebhookBackend.auditWebhookConfig?.name,
          [Controls.AuditWebhookBackendSecretNamespace]: auditWebhookBackend.auditWebhookConfig?.namespace,
          [Controls.AuditWebhookBackendInitialBackoff]: auditWebhookBackend.auditWebhookInitialBackoff,
        });
      }
    }
    this._enforce(Controls.AuditWebhookBackend, !!auditWebhookBackend);
    if (this.form.get(Controls.AuditWebhookBackend).value) {
      this._enforce(Controls.AuditWebhookBackendSecretName, !!auditWebhookBackend);
      this._enforce(Controls.AuditWebhookBackendSecretNamespace, !!auditWebhookBackend);
      this._enforce(Controls.AuditWebhookBackendInitialBackoff, !!auditWebhookBackend);
    }
  }

  isKubeLBEnabledForCluster(): boolean {
    return !!this.cluster?.spec?.kubelb?.enabled;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
