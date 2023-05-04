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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {
  IPV6_CIDR_PATTERN_VALIDATOR,
  IPV4_CIDR_PATTERN_VALIDATOR,
  IPV4_IPV6_CIDR_PATTERN,
} from '@app/shared/validators/others';
import {
  CiliumApplicationValuesDialogComponent,
  CiliumApplicationValuesDialogData,
} from './cilium-application-values-dialog/component';
import {ClusterService} from '@core/services/cluster';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {SettingsService} from '@core/services/settings';
import {WizardService} from '@core/services/wizard/wizard';
import {
  AuditPolicyPreset,
  Cluster,
  ClusterNetwork,
  ClusterSpec,
  CNIPlugin,
  ContainerRuntime,
  ExtraCloudSpecOptions,
  IPFamily,
  MasterVersion,
  ProxyMode,
  ExposeStrategy,
  NetworkRanges,
  ClusterAnnotation,
} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {AdminSettings} from '@shared/entity/settings';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {KmValidators} from '@shared/validators/validators';
import {combineLatest, merge} from 'rxjs';
import {filter, finalize, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {coerce, compare, gte} from 'semver';
import {StepBase} from '../base';
import {AsyncValidators} from '@shared/validators/async.validators';
import {
  CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE,
  CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP,
  CLUSTER_DEFAULT_NODE_SELECTOR_HINT,
  handleClusterDefaultNodeSelector,
} from '@shared/utils/cluster';
import {KeyValueEntry} from '@shared/types/common';
import {getEditionVersion} from '@shared/utils/common';

enum Controls {
  Name = 'name',
  Version = 'version',
  ContainerRuntime = 'containerRuntime',
  Type = 'type',
  AuditLogging = 'auditLogging',
  AuditPolicyPreset = 'auditPolicyPreset',
  UserSSHKeyAgent = 'userSSHKeyAgent',
  OperatingSystemManager = 'enableOperatingSystemManager',
  Labels = 'labels',
  AdmissionPlugins = 'admissionPlugins',
  SSHKeys = 'sshKeys',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
  EventRateLimitConfig = 'eventRateLimitConfig',
  OPAIntegration = 'opaIntegration',
  Konnectivity = 'konnectivity',
  MLALogging = 'loggingEnabled',
  KubernetesDashboardEnabled = 'kubernetesDashboardEnabled',
  MLAMonitoring = 'monitoringEnabled',
  ProxyMode = 'proxyMode',
  IPv4PodsCIDR = 'ipv4PodsCIDR',
  IPv6PodsCIDR = 'ipv6PodsCIDR',
  IPv4ServicesCIDR = 'ipv4ServicesCIDR',
  IPv6ServicesCIDR = 'ipv6ServicesCIDR',
  CNIPlugin = 'cniPlugin',
  CNIPluginVersion = 'cniPluginVersion',
  IPv4AllowedIPRange = 'ipv4AllowedIPRange',
  IPv6AllowedIPRange = 'ipv6AllowedIPRange',
  IPv4CIDRMaskSize = 'ipv4CIDRMaskSize',
  IPv6CIDRMaskSize = 'ipv6CIDRMaskSize',
  NodeLocalDNSCache = 'nodeLocalDNSCache',
  IPFamily = 'ipFamily',
  ExposeStrategy = 'exposeStrategy',
  APIServerAllowedIPRanges = 'apiServerAllowedIPRanges',
}

@Component({
  selector: 'km-wizard-cluster-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClusterStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ClusterStepComponent),
      multi: true,
    },
  ],
})
export class ClusterStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  containerRuntime = ContainerRuntime;
  admissionPlugin = AdmissionPlugin;
  masterVersions: MasterVersion[] = [];
  admissionPlugins: AdmissionPlugin[] = [];
  labels: Record<string, string>;
  podNodeSelectorAdmissionPluginConfig: Record<string, string>;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  proxyMode = ProxyMode;
  cniPlugin = CNIPlugin;
  cniPluginVersions: string[] = [];
  availableProxyModes = [ProxyMode.ipvs, ProxyMode.iptables];
  editionVersion: string = getEditionVersion();
  exposeStrategies = [ExposeStrategy.loadbalancer, ExposeStrategy.nodePort, ExposeStrategy.tunneling];
  isDualStackAllowed = false;
  clusterDefaultNodeSelectorNamespace: KeyValueEntry;
  clusterTemplateEditMode = false;
  loadingClusterDefaults = false;
  canEditCNIValues: boolean;
  cniApplicationValues: string;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE = CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP = CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP;
  readonly CLUSTER_DEFAULT_NODE_SELECTOR_HINT = CLUSTER_DEFAULT_NODE_SELECTOR_HINT;
  readonly ipv4AndIPv6CidrRegex = IPV4_IPV6_CIDR_PATTERN;
  readonly Controls = Controls;
  readonly AuditPolicyPreset = AuditPolicyPreset;
  readonly IPFamily = IPFamily;
  private _datacenterSpec: Datacenter;
  private _seedSettings: SeedSettings;
  private _settings: AdminSettings;
  private _defaultProxyMode: ProxyMode;
  private readonly _minNameLength = 5;
  private readonly _defaultAllowedIPRangeIPv4 = '0.0.0.0/0';
  private readonly _defaultAllowedIPRangeIPv6 = '::/0';
  private readonly _canalDualStackMinimumSupportedVersion = '3.22.0';
  private readonly _cniInitialValuesMinimumSupportedVersion = '1.13.0';

  get isKubernetesDashboardEnable(): boolean {
    return this._settings.enableDashboard;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _matDialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    wizard: WizardService
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this._initForm();

    this.clusterTemplateEditMode = this._clusterSpecService.clusterTemplateEditMode;
    this.cniApplicationValues =
      this._clusterSpecService.cluster.annotations?.[ClusterAnnotation.InitialCNIValuesRequest];

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      this._settings = settings;

      // Admin settings should be ignored in this case since we want to completely depend upon the cluster template
      // as the data source.
      if (this.clusterTemplateEditMode) {
        return;
      }

      this.form.get(Controls.MLALogging).setValue(this._settings.mlaOptions.loggingEnabled, {emitEvent: false});
      this._enforce(Controls.MLALogging, this._settings.mlaOptions.loggingEnforced);
      this.form.get(Controls.MLAMonitoring).setValue(this._settings.mlaOptions.monitoringEnabled, {emitEvent: false});
      this._enforce(Controls.MLAMonitoring, this._settings.mlaOptions.monitoringEnforced);

      this.form.get(Controls.OPAIntegration).setValue(this._settings.opaOptions.enabled);
      if (this._settings.opaOptions.enforced) {
        this.form.get(Controls.OPAIntegration).disable();
      }
      if (!settings.enableDashboard) {
        this.form.get(Controls.KubernetesDashboardEnabled).setValue(false);
      }
      this.form.updateValueAndValidity();
    });

    this._fetchCNIPlugins();

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(
        tap((datacenter: Datacenter) => {
          this._datacenterSpec = datacenter;
          this.isDualStackAllowed = !!datacenter.spec.ipv6Enabled;
          this._enforce(Controls.AuditLogging, datacenter.spec.enforceAuditLogging);
          this._enforcePodSecurityPolicy(datacenter.spec.enforcePodSecurityPolicy);
        })
      )
      .pipe(switchMap(_ => this._datacenterService.seedSettings(this._datacenterSpec.spec.seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((seedSettings: SeedSettings) => (this._seedSettings = seedSettings));

    this._clusterSpecService.providerChanges
      .pipe(switchMap(provider => this._clusterService.getMasterVersions(provider)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultVersion.bind(this));

    if (!this.clusterTemplateEditMode) {
      combineLatest([this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges])
        .pipe(
          filter(_ => {
            return !!this._clusterSpecService.provider && !!this._clusterSpecService.datacenter;
          })
        )
        .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.datacenter).pipe(take(1))))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          this._loadClusterDefaults();
        });
    }

    this.control(Controls.Version)
      .valueChanges.pipe(filter(value => !!value))
      .pipe(switchMap(() => this._clusterService.getAdmissionPlugins(this.form.get(Controls.Version).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins.map(p => AdmissionPlugin[p]).filter(p => !!p)));

    this.control(Controls.AdmissionPlugins)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterSpecService.admissionPlugins = this.form.get(Controls.AdmissionPlugins).value));

    merge(this.form.get(Controls.CNIPlugin).valueChanges, this.form.get(Controls.IPFamily).valueChanges)
      .pipe(switchMap(() => this._clusterService.getCNIPluginVersions(this.form.get(Controls.CNIPlugin).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cniVersions => {
        this._updateAvailableProxyModes();
        this.form.get(Controls.CNIPluginVersion).setValue('');
        this.cniPluginVersions = cniVersions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
        this._setDefaultCNIVersion();
      });

    this.control(Controls.Konnectivity)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._updateAvailableProxyModes();
      });

    combineLatest([this.control(Controls.ProxyMode).valueChanges, this.control(Controls.CNIPlugin).valueChanges])
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([proxyMode, cniPlugin]) => {
        const konnectivityControl = this.control(Controls.Konnectivity);

        if (proxyMode === ProxyMode.ebpf && cniPlugin === CNIPlugin.Cilium) {
          if (!konnectivityControl.value) {
            konnectivityControl.setValue(true);
          }
          konnectivityControl.disable();
        } else if (konnectivityControl.disabled) {
          konnectivityControl.enable();
        }
      });

    merge(
      this.control(Controls.IPFamily).valueChanges,
      this.control(Controls.IPv4AllowedIPRange).valueChanges,
      this.control(Controls.IPv6AllowedIPRange).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        let cidrBlocks = [];
        const ipv4AllowedIPRange = this.controlValue(Controls.IPv4AllowedIPRange);
        if (ipv4AllowedIPRange) {
          const ipv6AllowedIPRange = this.controlValue(Controls.IPv6AllowedIPRange);
          cidrBlocks =
            this.isDualStackIPFamilySelected() && ipv6AllowedIPRange
              ? [ipv4AllowedIPRange, ipv6AllowedIPRange]
              : [ipv4AllowedIPRange];
        }
        this._getExtraCloudSpecOptions().nodePortsAllowedIPRanges = {cidrBlocks};
      });

    this._initDualStackControlsValueChangeListeners();

    merge(
      this.form.get(Controls.ExposeStrategy).valueChanges,
      this.form.get(Controls.APIServerAllowedIPRanges).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        _ => (this._clusterSpecService.cluster.spec.apiServerAllowedIPRanges = this.getAPIServerAllowedIPRange())
      );

    merge(this.form.get(Controls.CNIPlugin).valueChanges, this.form.get(Controls.CNIPluginVersion).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._handleCNIPluginChanges());

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Version).valueChanges,
      this.form.get(Controls.AuditLogging).valueChanges,
      this.form.get(Controls.AuditPolicyPreset).valueChanges,
      this.form.get(Controls.UserSSHKeyAgent).valueChanges,
      this.form.get(Controls.OperatingSystemManager).valueChanges,
      this.form.get(Controls.KubernetesDashboardEnabled).valueChanges,
      this.form.get(Controls.OPAIntegration).valueChanges,
      this.form.get(Controls.Konnectivity).valueChanges,
      this.form.get(Controls.MLALogging).valueChanges,
      this.form.get(Controls.MLAMonitoring).valueChanges,
      this.form.get(Controls.ContainerRuntime).valueChanges,
      this.form.get(Controls.ProxyMode).valueChanges,
      this.form.get(Controls.IPFamily).valueChanges,
      this.form.get(Controls.IPv4PodsCIDR).valueChanges,
      this.form.get(Controls.IPv4ServicesCIDR).valueChanges,
      this.form.get(Controls.IPv4CIDRMaskSize).valueChanges,
      this.form.get(Controls.IPv6PodsCIDR).valueChanges,
      this.form.get(Controls.IPv6ServicesCIDR).valueChanges,
      this.form.get(Controls.IPv6CIDRMaskSize).valueChanges,
      this.form.get(Controls.NodeLocalDNSCache).valueChanges,
      this.form.get(Controls.CNIPlugin).valueChanges,
      this.form.get(Controls.CNIPluginVersion).valueChanges,
      this.form.get(Controls.ExposeStrategy).valueChanges,
      this.form.get(Controls.APIServerAllowedIPRanges).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    this._handleClusterSpecChanges();
    this._handleCNIPluginChanges();
    this._updateAvailableProxyModes();
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  onLabelsChange(labels: Record<string, string>): void {
    const [key, value] = this.clusterDefaultNodeSelectorNamespace ?? [];

    if (key && value) {
      labels = {...labels, [key]: value};
    }

    this.labels = labels;
    this._clusterSpecService.labels = labels;
  }

  onPodNodeSelectorAdmissionPluginConfigChange(config: Record<string, string>): void {
    this.podNodeSelectorAdmissionPluginConfig = config;
    this._clusterSpecService.podNodeSelectorAdmissionPluginConfig = this.podNodeSelectorAdmissionPluginConfig;

    handleClusterDefaultNodeSelector(
      this.labels ?? {},
      config,
      this.clusterDefaultNodeSelectorNamespace,
      (entry, labels) => {
        this.clusterDefaultNodeSelectorNamespace = entry;
        this.onLabelsChange(labels);
      }
    );
  }

  isEnforced(control: Controls): boolean {
    switch (control) {
      case Controls.AuditLogging:
        return !!this._datacenterSpec?.spec?.enforceAuditLogging;
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

  isPodSecurityPolicyEnforced(): boolean {
    return AdmissionPluginUtils.isPodSecurityPolicyEnforced(this._datacenterSpec);
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

  hasCNIPluginType(): boolean {
    return this.form.get(Controls.CNIPlugin).value !== CNIPlugin.None;
  }

  isAllowedIPRangeSupported(): boolean {
    return [NodeProvider.AWS, NodeProvider.AZURE, NodeProvider.GCP, NodeProvider.OPENSTACK].includes(
      this._clusterSpecService.provider
    );
  }

  isExposeStrategyLoadBalancer(): boolean {
    return this.form.get(Controls.ExposeStrategy).value === ExposeStrategy.loadbalancer;
  }

  isDualStackIPFamilySelected(): boolean {
    return this.form.get(Controls.IPFamily).value === IPFamily.DualStack;
  }

  editCNIValues() {
    const dialogData = {
      data: {
        applicationValues: this.cniApplicationValues,
      } as CiliumApplicationValuesDialogData,
    };
    const dialogRef = this._matDialog.open(CiliumApplicationValuesDialogComponent, dialogData);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .pipe(filter(Boolean))
      .subscribe(updatedValues => {
        this.cniApplicationValues = updatedValues;
        this._clusterSpecService.cluster = this._getClusterEntity();
      });
  }

  // eslint-disable-next-line complexity
  private _initForm(): void {
    const clusterSpec = this._clusterSpecService?.cluster?.spec;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._clusterSpecService?.cluster?.name ?? '', [
        Validators.required,
        Validators.minLength(this._minNameLength),
      ]),
      [Controls.Version]: this._builder.control(clusterSpec?.version ?? '', [Validators.required]),
      [Controls.ContainerRuntime]: this._builder.control(clusterSpec?.containerRuntime ?? ContainerRuntime.Containerd, [
        Validators.required,
      ]),
      [Controls.AuditLogging]: this._builder.control(clusterSpec?.auditLogging?.enabled ?? false),
      [Controls.AuditPolicyPreset]: this._builder.control(clusterSpec?.auditLogging?.policyPreset ?? ''),
      [Controls.UserSSHKeyAgent]: this._builder.control(clusterSpec?.enableUserSSHKeyAgent ?? true),
      [Controls.OperatingSystemManager]: this._builder.control(clusterSpec?.enableOperatingSystemManager ?? true),
      [Controls.OPAIntegration]: this._builder.control(clusterSpec?.opaIntegration?.enabled ?? false),
      [Controls.Konnectivity]: this._builder.control(clusterSpec?.clusterNetwork?.konnectivityEnabled ?? true),
      [Controls.MLALogging]: this._builder.control(clusterSpec?.mla?.loggingEnabled ?? false),
      [Controls.KubernetesDashboardEnabled]: this._builder.control(clusterSpec?.kubernetesDashboard?.enabled ?? true),
      [Controls.MLAMonitoring]: this._builder.control(clusterSpec?.mla?.monitoringEnabled ?? false),
      [Controls.AdmissionPlugins]: this._builder.control(clusterSpec?.admissionPlugins ?? []),
      [Controls.EventRateLimitConfig]: this._builder.control(clusterSpec?.eventRateLimitConfig ?? ''),
      // We intentionally don't default labels and podNodeSelectorAdmissionPluginConfig to the values from
      // clusterSpecService and instead just rely on `onLabelsChange` method for the defaulting.
      [Controls.Labels]: this._builder.control(null),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: this._builder.control(null),
      [Controls.SSHKeys]: this._builder.control(this._clusterSpecService?.sshKeys ?? ''),
      [Controls.IPFamily]: this._builder.control(clusterSpec?.clusterNetwork?.ipFamily ?? IPFamily.IPv4),
      [Controls.ProxyMode]: this._builder.control(clusterSpec?.clusterNetwork?.proxyMode ?? ''),
      [Controls.CNIPlugin]: this._builder.control(clusterSpec?.cniPlugin?.type ?? CNIPlugin.Canal),
      [Controls.CNIPluginVersion]: this._builder.control(clusterSpec?.cniPlugin?.version ?? ''),
      [Controls.IPv4CIDRMaskSize]: this._builder.control(clusterSpec?.clusterNetwork?.nodeCidrMaskSizeIPv4 ?? null),
      [Controls.IPv6CIDRMaskSize]: this._builder.control(clusterSpec?.clusterNetwork?.nodeCidrMaskSizeIPv6 ?? null),
      [Controls.NodeLocalDNSCache]: this._builder.control(
        clusterSpec?.clusterNetwork?.nodeLocalDNSCacheEnabled ?? false
      ),
      [Controls.ExposeStrategy]: this._builder.control(clusterSpec?.exposeStrategy ?? null),
      [Controls.APIServerAllowedIPRanges]: this._builder.control(
        clusterSpec?.apiServerAllowedIPRanges?.cidrBlocks ?? null
      ),
      [Controls.IPv4PodsCIDR]: this._builder.control(NetworkRanges.ipv4CIDR(clusterSpec?.clusterNetwork?.pods) ?? '', [
        IPV4_CIDR_PATTERN_VALIDATOR,
        this._dualStackRequiredIfValidator(Controls.IPv6PodsCIDR),
      ]),
      [Controls.IPv6PodsCIDR]: this._builder.control(NetworkRanges.ipv6CIDR(clusterSpec?.clusterNetwork?.pods) ?? '', [
        IPV6_CIDR_PATTERN_VALIDATOR,
        this._dualStackRequiredIfValidator(Controls.IPv4PodsCIDR),
      ]),
      [Controls.IPv4ServicesCIDR]: this._builder.control(
        NetworkRanges.ipv4CIDR(clusterSpec?.clusterNetwork?.services) ?? '',
        [IPV4_CIDR_PATTERN_VALIDATOR, this._dualStackRequiredIfValidator(Controls.IPv6ServicesCIDR)]
      ),
      [Controls.IPv6ServicesCIDR]: this._builder.control(
        NetworkRanges.ipv6CIDR(clusterSpec?.clusterNetwork?.services) ?? '',
        [IPV6_CIDR_PATTERN_VALIDATOR, this._dualStackRequiredIfValidator(Controls.IPv4ServicesCIDR)]
      ),
      [Controls.IPv4AllowedIPRange]: this._builder.control(
        this.isAllowedIPRangeSupported()
          ? NetworkRanges.ipv4CIDR(this._getExtraCloudSpecOptions().nodePortsAllowedIPRanges)
          : '',
        [IPV4_CIDR_PATTERN_VALIDATOR, this._dualStackRequiredIfValidator(Controls.IPv6AllowedIPRange)]
      ),
      [Controls.IPv6AllowedIPRange]: this._builder.control(
        this.isAllowedIPRangeSupported()
          ? NetworkRanges.ipv6CIDR(this._getExtraCloudSpecOptions().nodePortsAllowedIPRanges)
          : '',
        [IPV6_CIDR_PATTERN_VALIDATOR, this._dualStackRequiredIfValidator(Controls.IPv4AllowedIPRange)]
      ),
    });
  }

  private _loadClusterDefaults(): void {
    this.loadingClusterDefaults = true;
    this._clusterService
      .getClusterDefaults(this._clusterSpecService.provider, this._clusterSpecService.datacenter)
      .pipe(filter(defaults => !!defaults && Object.keys(defaults).length > 0))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        finalize(() => {
          this.loadingClusterDefaults = false;
          this._cdr.detectChanges();
        })
      )
      // eslint-disable-next-line complexity
      .subscribe((cluster: Cluster) => {
        this._clusterSpecService.cluster = cluster;
        const clusterSpec = cluster?.spec;

        this.form.patchValue({
          [Controls.Name]: this._clusterSpecService?.cluster?.name ?? this.controlValue(Controls.Name),
          // remove the 'v' prefix from the version
          [Controls.Version]:
            (clusterSpec?.version && clusterSpec?.version.replace('v', '')) ?? this.controlValue(Controls.Version),
          [Controls.ContainerRuntime]: clusterSpec?.containerRuntime ?? this.controlValue(Controls.ContainerRuntime),
          [Controls.AuditLogging]: clusterSpec?.auditLogging?.enabled ?? this.controlValue(Controls.AuditLogging),
          [Controls.AuditPolicyPreset]:
            clusterSpec?.auditLogging?.policyPreset ?? this.controlValue(Controls.AuditPolicyPreset),
          [Controls.UserSSHKeyAgent]: clusterSpec?.enableUserSSHKeyAgent ?? this.controlValue(Controls.UserSSHKeyAgent),
          [Controls.OperatingSystemManager]:
            clusterSpec?.enableOperatingSystemManager ?? this.controlValue(Controls.OperatingSystemManager),
          [Controls.OPAIntegration]: clusterSpec?.opaIntegration?.enabled ?? this.controlValue(Controls.OPAIntegration),
          [Controls.Konnectivity]:
            clusterSpec?.clusterNetwork?.konnectivityEnabled ?? this.controlValue(Controls.Konnectivity),
          [Controls.MLALogging]: clusterSpec?.mla?.loggingEnabled ?? this.controlValue(Controls.MLALogging),
          [Controls.KubernetesDashboardEnabled]:
            (this.isKubernetesDashboardEnable && clusterSpec?.kubernetesDashboard?.enabled) ??
            this.controlValue(Controls.KubernetesDashboardEnabled),
          [Controls.MLAMonitoring]: clusterSpec?.mla?.monitoringEnabled ?? this.controlValue(Controls.MLAMonitoring),
          [Controls.AdmissionPlugins]: clusterSpec?.admissionPlugins ?? this.controlValue(Controls.AdmissionPlugins),
          [Controls.EventRateLimitConfig]:
            clusterSpec?.eventRateLimitConfig ?? this.controlValue(Controls.EventRateLimitConfig),
          [Controls.Labels]: cluster?.labels ?? this.controlValue(Controls.Labels),
          [Controls.PodNodeSelectorAdmissionPluginConfig]:
            clusterSpec?.podNodeSelectorAdmissionPluginConfig ??
            this.controlValue(Controls.PodNodeSelectorAdmissionPluginConfig),
          [Controls.ProxyMode]: clusterSpec?.clusterNetwork?.proxyMode ?? this.controlValue(Controls.ProxyMode),
          [Controls.CNIPluginVersion]: clusterSpec?.cniPlugin?.version ?? this.controlValue(Controls.CNIPluginVersion),
          [Controls.IPv4CIDRMaskSize]:
            clusterSpec?.clusterNetwork?.nodeCidrMaskSizeIPv4 ?? this.controlValue(Controls.IPv4CIDRMaskSize),
          [Controls.IPv6CIDRMaskSize]:
            clusterSpec?.clusterNetwork?.nodeCidrMaskSizeIPv6 ?? this.controlValue(Controls.IPv6CIDRMaskSize),
          [Controls.NodeLocalDNSCache]:
            clusterSpec?.clusterNetwork?.nodeLocalDNSCacheEnabled ?? this.controlValue(Controls.NodeLocalDNSCache),
          [Controls.ExposeStrategy]: clusterSpec?.exposeStrategy ?? this.controlValue(Controls.ExposeStrategy),
          [Controls.APIServerAllowedIPRanges]:
            clusterSpec?.apiServerAllowedIPRanges?.cidrBlocks ?? this.controlValue(Controls.APIServerAllowedIPRanges),
          [Controls.IPv4PodsCIDR]:
            NetworkRanges.ipv4CIDR(clusterSpec?.clusterNetwork?.pods) ?? this.controlValue(Controls.IPv4PodsCIDR),
          [Controls.IPv6PodsCIDR]:
            NetworkRanges.ipv6CIDR(clusterSpec?.clusterNetwork?.pods) ?? this.controlValue(Controls.IPv6PodsCIDR),
          [Controls.IPv4ServicesCIDR]:
            NetworkRanges.ipv4CIDR(clusterSpec?.clusterNetwork?.services) ??
            this.controlValue(Controls.IPv4ServicesCIDR),
          [Controls.IPv6ServicesCIDR]:
            NetworkRanges.ipv6CIDR(clusterSpec?.clusterNetwork?.services) ??
            this.controlValue(Controls.IPv6ServicesCIDR),
        });

        // Selective patching of the form values to avoid trigger of valueChanges
        // and to avoid resetting of the form values.
        this.form.patchValue(
          {
            [Controls.IPFamily]: clusterSpec?.clusterNetwork?.ipFamily ?? this.controlValue(Controls.IPFamily),
            [Controls.CNIPlugin]: clusterSpec?.cniPlugin?.type ?? this.controlValue(Controls.CNIPlugin),
          },
          {emitEvent: false}
        );

        [Controls.IPFamily, Controls.CNIPlugin].forEach(control =>
          this.control(control).updateValueAndValidity({emitEvent: false})
        );

        if (!this.isDualStackAllowed) {
          this.control(Controls.IPFamily).reset();
          this.control(Controls.IPFamily).setValue(IPFamily.IPv4);
        }

        if (this.isAllowedIPRangeSupported()) {
          this.form.patchValue({
            [Controls.IPv4AllowedIPRange]:
              NetworkRanges.ipv4CIDR(this._getExtraCloudSpecOptions().nodePortsAllowedIPRanges) ??
              this._defaultAllowedIPRangeIPv4,
            [Controls.IPv6AllowedIPRange]:
              NetworkRanges.ipv6CIDR(this._getExtraCloudSpecOptions().nodePortsAllowedIPRanges) ??
              this._defaultAllowedIPRangeIPv6,
          });
        } else {
          this.form.patchValue({
            [Controls.IPv4AllowedIPRange]: null,
            [Controls.IPv6AllowedIPRange]: null,
          });
        }

        this._handleClusterSpecChanges();
        this._handleCNIPluginChanges();
        this._updateAvailableProxyModes();
        this._fetchCNIPlugins();
        this._defaultProxyMode = clusterSpec?.clusterNetwork?.proxyMode;
        this.cniApplicationValues = cluster.annotations?.[ClusterAnnotation.InitialCNIValuesRequest];
        this.loadingClusterDefaults = false;
        this._cdr.detectChanges();
      });
  }

  private _handleClusterSpecChanges(): void {
    const clusterSpec = this._clusterSpecService?.cluster?.spec;

    if (clusterSpec?.cloud?.dc) {
      this.onLabelsChange(this._clusterSpecService.cluster.labels ?? null);

      if (clusterSpec?.podNodeSelectorAdmissionPluginConfig) {
        this.onPodNodeSelectorAdmissionPluginConfigChange(clusterSpec?.podNodeSelectorAdmissionPluginConfig);
      }
    }
  }

  private _handleCNIPluginChanges(): void {
    const cniVersion = this.controlValue(Controls.CNIPluginVersion);
    const cniPlugin = this.controlValue(Controls.CNIPlugin);
    this.canEditCNIValues =
      cniPlugin === CNIPlugin.Cilium &&
      cniVersion &&
      gte(coerce(cniVersion), this._cniInitialValuesMinimumSupportedVersion);
  }

  private _fetchCNIPlugins(): void {
    this._clusterService
      .getCNIPluginVersions(this.form.get(Controls.CNIPlugin).value)
      .pipe(take(1))
      .subscribe(versions => {
        this.cniPluginVersions = versions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
        this._setDefaultCNIVersion();
      });
  }

  private _dualStackRequiredIfValidator(control: Controls): ValidatorFn {
    return KmValidators.requiredIf(() => this.isDualStackIPFamilySelected() && !!this.form.get(control).value);
  }

  private _initDualStackControlsValueChangeListeners(): void {
    const ipv4Controls = [Controls.IPv4PodsCIDR, Controls.IPv4ServicesCIDR, Controls.IPv4AllowedIPRange];
    const ipv6Controls = [Controls.IPv6PodsCIDR, Controls.IPv6ServicesCIDR, Controls.IPv6AllowedIPRange];

    merge(
      this.control(Controls.IPFamily).valueChanges,
      ...ipv6Controls.map(control => this.control(control).valueChanges)
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        ipv4Controls.forEach(control => this.control(control).updateValueAndValidity({emitEvent: false}));
      });

    merge(
      this.control(Controls.IPFamily).valueChanges,
      ...ipv4Controls.map(control => this.control(control).valueChanges)
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        ipv6Controls.forEach(control => this.control(control).updateValueAndValidity({emitEvent: false}));
      });
  }

  private _enforce(control: Controls, isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(control).disable();
    }
  }

  private _enforcePodSecurityPolicy(isEnforced: boolean): void {
    if (isEnforced) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.get(Controls.AdmissionPlugins),
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.get(Controls.AdmissionPlugins).setValue(value);
    }
  }

  private _setDefaultVersion(versions: MasterVersion[]): void {
    this.masterVersions = versions;

    if (this._clusterSpecService.cluster.spec.version) {
      this.control(Controls.Version).setValue(this._clusterSpecService.cluster.spec.version);
      return;
    }

    for (const version of versions) {
      if (version.default) {
        this.control(Controls.Version).setValue(version.version);
      }
    }
  }

  private _setDefaultCNIVersion(): void {
    if (this.cniPluginVersions.length > 0 && !this.form.get(Controls.CNIPluginVersion).value) {
      // Dual-stack not allowed on Canal CNI version lower than 3.22.
      if (this.controlValue(Controls.CNIPlugin) === CNIPlugin.Canal && this.isDualStackIPFamilySelected()) {
        this.cniPluginVersions = this.cniPluginVersions.filter(v =>
          gte(coerce(v), this._canalDualStackMinimumSupportedVersion)
        );
      }

      this.form.get(Controls.CNIPluginVersion).setValue(this.cniPluginVersions[this.cniPluginVersions.length - 1]);
    }
  }

  private _updateAvailableProxyModes(): void {
    const proxyModeControl = this.control(Controls.ProxyMode);
    let newValue: ProxyMode;
    if (this.controlValue(Controls.CNIPlugin) === CNIPlugin.Cilium) {
      if (this.controlValue(Controls.Konnectivity)) {
        this.availableProxyModes = [ProxyMode.iptables, ProxyMode.ebpf];
        if (proxyModeControl.value === ProxyMode.ipvs) {
          newValue = ProxyMode.ebpf;
        }
      } else {
        this.availableProxyModes = [ProxyMode.iptables];
        newValue = ProxyMode.iptables;
      }
    } else {
      this.availableProxyModes = [ProxyMode.ipvs, ProxyMode.iptables];
      if (proxyModeControl.pristine || !this.availableProxyModes.includes(proxyModeControl.value)) {
        newValue = this._defaultProxyMode || ProxyMode.ipvs;
      }
    }
    if (newValue && newValue !== proxyModeControl.value) {
      proxyModeControl.setValue(newValue);
    }
  }

  private _getExtraCloudSpecOptions(): ExtraCloudSpecOptions {
    return (
      this._clusterSpecService.cluster?.spec?.cloud[this._clusterSpecService.provider] || ({} as ExtraCloudSpecOptions)
    );
  }

  private getAPIServerAllowedIPRange(): NetworkRanges {
    let apiServerAllowedIPRange = null;

    if (this.controlValue(Controls.ExposeStrategy) !== ExposeStrategy.loadbalancer) {
      return apiServerAllowedIPRange;
    }
    apiServerAllowedIPRange = this.controlValue(Controls.APIServerAllowedIPRanges)?.tags;
    return {
      cidrBlocks: apiServerAllowedIPRange ? apiServerAllowedIPRange : [],
    };
  }

  private _getClusterEntity(): Cluster {
    const ipv4Pods = this.controlValue(Controls.IPv4PodsCIDR);
    const ipv4Services = this.controlValue(Controls.IPv4ServicesCIDR);
    const cniPluginType = this.controlValue(Controls.CNIPlugin);
    const cniPluginVersion = this.controlValue(Controls.CNIPluginVersion);
    const cniPlugin = cniPluginType ? {type: cniPluginType, version: cniPluginVersion} : null;
    const konnectivity = this.controlValue(Controls.Konnectivity);
    const clusterNetwork = {
      ipFamily: this.controlValue(Controls.IPFamily),
      proxyMode: this.controlValue(Controls.ProxyMode),
      pods: {cidrBlocks: ipv4Pods ? [ipv4Pods] : []},
      services: {cidrBlocks: ipv4Services ? [ipv4Services] : []},
      nodeCidrMaskSizeIPv4: this.controlValue(Controls.IPv4CIDRMaskSize),
      nodeLocalDNSCacheEnabled: this.controlValue(Controls.NodeLocalDNSCache),
      konnectivityEnabled: konnectivity,
    } as ClusterNetwork;

    let annotations = this._clusterSpecService.cluster.annotations;
    if (this.cniApplicationValues) {
      annotations = {
        ...(annotations || {}),
        [ClusterAnnotation.InitialCNIValuesRequest]: this.canEditCNIValues ? this.cniApplicationValues : null,
      };
    }

    if (this.isDualStackIPFamilySelected()) {
      const ipv6Pods = this.controlValue(Controls.IPv6PodsCIDR);
      if (ipv4Pods && ipv6Pods) {
        clusterNetwork.pods.cidrBlocks = [...clusterNetwork.pods.cidrBlocks, ipv6Pods];
      }
      const ipv6Services = this.controlValue(Controls.IPv6ServicesCIDR);
      if (ipv4Services && ipv6Services) {
        clusterNetwork.services.cidrBlocks = [...clusterNetwork.services.cidrBlocks, ipv6Services];
      }
      clusterNetwork.nodeCidrMaskSizeIPv6 = this.controlValue(Controls.IPv6CIDRMaskSize);
    } else {
      clusterNetwork.nodeCidrMaskSizeIPv6 = null;
    }

    return {
      name: this.controlValue(Controls.Name),
      annotations,
      spec: {
        version: this.controlValue(Controls.Version),
        auditLogging: {
          enabled: this.controlValue(Controls.AuditLogging),
          policyPreset: this.controlValue(Controls.AuditPolicyPreset),
        },
        opaIntegration: {
          enabled: this.controlValue(Controls.OPAIntegration),
        },
        kubernetesDashboard: {
          enabled: this.controlValue(Controls.KubernetesDashboardEnabled),
        },
        mla: {
          loggingEnabled: this.controlValue(Controls.MLALogging),
          monitoringEnabled: this.controlValue(Controls.MLAMonitoring),
        },
        enableUserSSHKeyAgent: this.controlValue(Controls.UserSSHKeyAgent),
        exposeStrategy: this.controlValue(Controls.ExposeStrategy),
        enableOperatingSystemManager: this.controlValue(Controls.OperatingSystemManager),
        containerRuntime: this.controlValue(Controls.ContainerRuntime),
        clusterNetwork,
        cniPlugin: cniPlugin,
        apiServerAllowedIPRanges: this.getAPIServerAllowedIPRange(),
      } as ClusterSpec,
    } as Cluster;
  }
}
