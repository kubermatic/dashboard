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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {IPV6_CIDR_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {ClusterService} from '@core/services/cluster';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {FeatureGateService} from '@core/services/feature-gate';
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
  END_OF_DOCKER_SUPPORT_VERSION,
  ExtraCloudSpecOptions,
  MasterVersion,
  ProxyMode,
} from '@shared/entity/cluster';
import {ResourceType} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {AdminSettings} from '@shared/entity/settings';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import {CIDR_PATTERN_VALIDATOR} from '@shared/validators/others';
import {KmValidators} from '@shared/validators/validators';
import {combineLatest, merge} from 'rxjs';
import {filter, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import * as semver from 'semver';
import {coerce, compare} from 'semver';
import {StepBase} from '../base';

enum Controls {
  Name = 'name',
  Version = 'version',
  ContainerRuntime = 'containerRuntime',
  Type = 'type',
  AuditLogging = 'auditLogging',
  AuditPolicyPreset = 'auditPolicyPreset',
  UserSSHKeyAgent = 'userSshKeyAgent',
  OperatingSystemManager = 'enableOperatingSystemManager',
  Labels = 'labels',
  AdmissionPlugins = 'admissionPlugins',
  SSHKeys = 'sshKeys',
  PodNodeSelectorAdmissionPluginConfig = 'podNodeSelectorAdmissionPluginConfig',
  EventRateLimitConfig = 'eventRateLimitConfig',
  OPAIntegration = 'opaIntegration',
  Konnectivity = 'konnectivity',
  MLALogging = 'loggingEnabled',
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
}

enum NetworkType {
  IPv4 = 'ipv4',
  DualStack = 'ipv4+ipv6',
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
  labels: object;
  operatingSystemManagerFeatureEnabled: boolean;
  podNodeSelectorAdmissionPluginConfig: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  proxyMode = ProxyMode;
  cniPlugin = CNIPlugin;
  cniPluginVersions: string[] = [];
  availableProxyModes = [ProxyMode.ipvs, ProxyMode.iptables];
  isKonnectivityEnabled = false;
  isDualStackAllowed = false;
  readonly Controls = Controls;
  readonly AuditPolicyPreset = AuditPolicyPreset;
  readonly NetworkType = NetworkType;
  private _datacenterSpec: Datacenter;
  private _seedSettings: SeedSettings;
  private _settings: AdminSettings;
  private readonly _minNameLength = 5;
  private readonly _defaultAllowedIPRange = '0.0.0.0/0';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    private readonly _featureGatesService: FeatureGateService,
    wizard: WizardService
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this._featureGatesService.featureGates.pipe(takeUntil(this._unsubscribe)).subscribe(featureGates => {
      this.isKonnectivityEnabled = !!featureGates?.konnectivityService;
      this.operatingSystemManagerFeatureEnabled = featureGates?.operatingSystemManager;
    });

    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, Validators.minLength(this._minNameLength)]),
      [Controls.Version]: this._builder.control('', [Validators.required]),
      [Controls.ContainerRuntime]: this._builder.control(ContainerRuntime.Containerd, [Validators.required]),
      [Controls.AuditLogging]: this._builder.control(false),
      [Controls.AuditPolicyPreset]: this._builder.control(''),
      [Controls.UserSSHKeyAgent]: this._builder.control(true),
      [Controls.OperatingSystemManager]: this._builder.control(false),
      [Controls.OPAIntegration]: this._builder.control(false),
      [Controls.Konnectivity]: this._builder.control(true),
      [Controls.MLALogging]: this._builder.control(false),
      [Controls.MLAMonitoring]: this._builder.control(false),
      [Controls.AdmissionPlugins]: this._builder.control([]),
      [Controls.PodNodeSelectorAdmissionPluginConfig]: this._builder.control(''),
      [Controls.EventRateLimitConfig]: this._builder.control(''),
      [Controls.Labels]: this._builder.control(''),
      [Controls.SSHKeys]: this._builder.control(''),
      [Controls.IPFamily]: this._builder.control(NetworkType.IPv4),
      [Controls.ProxyMode]: this._builder.control(''),
      [Controls.IPv4PodsCIDR]: this._builder.control('', [
        CIDR_PATTERN_VALIDATOR,
        KmValidators.requiredIf(
          () => this.isDualStackNetworkTypeSelected() && !!this.form.get(Controls.IPv6PodsCIDR).value
        ),
      ]),
      [Controls.IPv6PodsCIDR]: this._builder.control('', [IPV6_CIDR_PATTERN_VALIDATOR]),
      [Controls.IPv4ServicesCIDR]: this._builder.control('', [
        CIDR_PATTERN_VALIDATOR,
        KmValidators.requiredIf(
          () => this.isDualStackNetworkTypeSelected() && !!this.form.get(Controls.IPv6ServicesCIDR).value
        ),
      ]),
      [Controls.IPv6ServicesCIDR]: this._builder.control('', [IPV6_CIDR_PATTERN_VALIDATOR]),
      [Controls.CNIPlugin]: this._builder.control(CNIPlugin.Canal),
      [Controls.CNIPluginVersion]: this._builder.control(''),
      [Controls.IPv4AllowedIPRange]: this._builder.control(this._defaultAllowedIPRange, [
        CIDR_PATTERN_VALIDATOR,
        KmValidators.requiredIf(
          () => this.isDualStackNetworkTypeSelected() && !!this.form.get(Controls.IPv6AllowedIPRange).value
        ),
      ]),
      [Controls.IPv6AllowedIPRange]: this._builder.control('', [IPV6_CIDR_PATTERN_VALIDATOR]),
      [Controls.IPv4CIDRMaskSize]: this._builder.control(''),
      [Controls.IPv6CIDRMaskSize]: this._builder.control(''),
      [Controls.NodeLocalDNSCache]: this._builder.control(false),
    });

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      this._settings = settings;

      this.form.get(Controls.MLALogging).setValue(this._settings.mlaOptions.loggingEnabled, {emitEvent: false});
      this._enforce(Controls.MLALogging, this._settings.mlaOptions.loggingEnforced);
      this.form.get(Controls.MLAMonitoring).setValue(this._settings.mlaOptions.monitoringEnabled, {emitEvent: false});
      this._enforce(Controls.MLAMonitoring, this._settings.mlaOptions.monitoringEnforced);

      this.form.get(Controls.OPAIntegration).setValue(this._settings.opaOptions.enabled);
      if (this._settings.opaOptions.enforced) {
        this.form.get(Controls.OPAIntegration).disable();
      }
      this.form.updateValueAndValidity();
    });

    this._clusterService
      .getCNIPluginVersions(this.form.get(Controls.CNIPlugin).value)
      .pipe(take(1))
      .subscribe(versions => {
        this.cniPluginVersions = versions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
        this._setDefaultCNIVersion();
      });

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(
        tap((datacenter: Datacenter) => {
          this._datacenterSpec = datacenter;
          this.isDualStackAllowed = !!datacenter.spec.ipv6Enabled;
          this._enforce(Controls.AuditLogging, datacenter.spec.enforceAuditLogging);
          this._enforcePodSecurityPolicy(datacenter.spec.enforcePodSecurityPolicy);
          this._setNetworkDefaults();
        })
      )
      .pipe(switchMap(_ => this._datacenterService.seedSettings(this._datacenterSpec.spec.seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((seedSettings: SeedSettings) => (this._seedSettings = seedSettings));

    this._clusterSpecService.providerChanges
      .pipe(
        // resetting so that `_setDefaultNetworkControls` can set the default value
        tap(_ => {
          this.form.get(Controls.IPv4AllowedIPRange).reset();
          this.form.get(Controls.IPv6AllowedIPRange).reset();
        })
      )
      .pipe(switchMap(provider => this._clusterService.getMasterVersions(provider)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultVersion.bind(this));

    combineLatest([
      this.control(Controls.Version).valueChanges.pipe(startWith(this.control(Controls.Version).value)),
      this.control(Controls.ContainerRuntime).valueChanges.pipe(
        startWith(this.control(Controls.ContainerRuntime).value)
      ),
    ])
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([version, containerRuntime]) => {
        if (
          semver.valid(version) &&
          semver.gte(version, END_OF_DOCKER_SUPPORT_VERSION) &&
          containerRuntime === ContainerRuntime.Docker
        ) {
          this.control(Controls.ContainerRuntime).setErrors({dockerVersionCompatibility: true});
        } else {
          this.control(Controls.ContainerRuntime).setErrors(null);
        }
      });

    this.control(Controls.Version)
      .valueChanges.pipe(filter(value => !!value))
      .pipe(switchMap(() => this._clusterService.getAdmissionPlugins(this.form.get(Controls.Version).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins.map(p => AdmissionPlugin[p]).filter(p => !!p)));

    this.control(Controls.AdmissionPlugins)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterSpecService.admissionPlugins = this.form.get(Controls.AdmissionPlugins).value));

    this.control(Controls.CNIPlugin)
      .valueChanges.pipe(filter(value => !!value))
      .pipe(switchMap(() => this._clusterService.getCNIPluginVersions(this.form.get(Controls.CNIPlugin).value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cniVersions => {
        this.updateCNIPluginOptions();
        this.form.get(Controls.CNIPluginVersion).setValue('');
        this.cniPluginVersions = cniVersions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
        this._setDefaultCNIVersion();
      });

    this.control(Controls.Konnectivity)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.updateCNIPluginOptions();
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

    merge(this.control(Controls.IPv4AllowedIPRange).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(ipRange => (this._getExtraCloudSpecOptions().nodePortsAllowedIPRange = ipRange));

    merge(
      this.control(Controls.IPFamily).valueChanges,
      this.control(Controls.IPv6PodsCIDR).valueChanges,
      this.control(Controls.IPv6ServicesCIDR).valueChanges,
      this.control(Controls.IPv6AllowedIPRange).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.control(Controls.IPv4PodsCIDR).updateValueAndValidity();
        this.control(Controls.IPv4ServicesCIDR).updateValueAndValidity();
        this.control(Controls.IPv4AllowedIPRange).updateValueAndValidity();
      });

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Version).valueChanges,
      this.form.get(Controls.AuditLogging).valueChanges,
      this.form.get(Controls.AuditPolicyPreset).valueChanges,
      this.form.get(Controls.UserSSHKeyAgent).valueChanges,
      this.form.get(Controls.OperatingSystemManager).valueChanges,
      this.form.get(Controls.OPAIntegration).valueChanges,
      this.form.get(Controls.Konnectivity).valueChanges,
      this.form.get(Controls.MLALogging).valueChanges,
      this.form.get(Controls.MLAMonitoring).valueChanges,
      this.form.get(Controls.ContainerRuntime).valueChanges,
      this.form.get(Controls.ProxyMode).valueChanges,
      this.form.get(Controls.IPv4PodsCIDR).valueChanges,
      this.form.get(Controls.IPv4ServicesCIDR).valueChanges,
      this.form.get(Controls.IPv4CIDRMaskSize).valueChanges,
      this.form.get(Controls.IPv6PodsCIDR).valueChanges,
      this.form.get(Controls.IPv6ServicesCIDR).valueChanges,
      this.form.get(Controls.IPv6CIDRMaskSize).valueChanges,
      this.form.get(Controls.NodeLocalDNSCache).valueChanges,
      this.form.get(Controls.CNIPlugin).valueChanges,
      this.form.get(Controls.CNIPluginVersion).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._clusterSpecService.labels = this.labels;
  }

  onPodNodeSelectorAdmissionPluginConfigChange(config: object): void {
    this.podNodeSelectorAdmissionPluginConfig = config;
    this._clusterSpecService.podNodeSelectorAdmissionPluginConfig = this.podNodeSelectorAdmissionPluginConfig;
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

  updateCNIPluginOptions() {
    if (
      this.controlValue(Controls.CNIPlugin) === CNIPlugin.Cilium &&
      this.isKonnectivityEnabled &&
      !!this.controlValue(Controls.Konnectivity)
    ) {
      this.availableProxyModes = [ProxyMode.ipvs, ProxyMode.iptables, ProxyMode.ebpf];
    } else {
      this.availableProxyModes = [ProxyMode.ipvs, ProxyMode.iptables];
    }
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
    return [NodeProvider.AZURE, NodeProvider.GCP, NodeProvider.OPENSTACK, NodeProvider.AWS].includes(
      this._clusterSpecService.provider
    );
  }

  isDualStackNetworkTypeSelected(): boolean {
    return this.form.get(Controls.IPFamily).value === NetworkType.DualStack;
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
    for (const version of versions) {
      if (version.default) {
        this.control(Controls.Version).setValue(version.version);
      }
    }
  }

  private _setDefaultCNIVersion(): void {
    if (this.cniPluginVersions.length > 0 && !this.form.get(Controls.CNIPluginVersion).value) {
      this.form.get(Controls.CNIPluginVersion).setValue(this.cniPluginVersions[this.cniPluginVersions.length - 1]);
    }
  }

  private _setNetworkDefaults(): void {
    if (!this.isDualStackAllowed) {
      this.control(Controls.IPFamily).reset();
      this.control(Controls.IPFamily).setValue(NetworkType.IPv4);
    }

    this._clusterService
      .getClusterNetworkDefaults(this._clusterSpecService.provider, this._clusterSpecService.datacenter)
      .pipe(take(1))
      .subscribe({
        next: networkDefaults => {
          if (networkDefaults.proxyMode && this.form.get(Controls.ProxyMode).pristine) {
            this.form.get(Controls.ProxyMode).setValue(networkDefaults.proxyMode);
          }
          if (networkDefaults.ipv4?.podsCidr && this.form.get(Controls.IPv4PodsCIDR).pristine) {
            this.form.get(Controls.IPv4PodsCIDR).setValue(networkDefaults.ipv4.podsCidr);
          }
          if (networkDefaults.ipv4?.servicesCidr && this.form.get(Controls.IPv4ServicesCIDR).pristine) {
            this.form.get(Controls.IPv4ServicesCIDR).setValue(networkDefaults.ipv4.servicesCidr);
          }
          if (networkDefaults.ipv4?.nodeCidrMaskSize) {
            this.form.get(Controls.IPv4CIDRMaskSize).setValue(networkDefaults.ipv4.nodeCidrMaskSize);
          }
          if (networkDefaults.ipv6?.podsCidr) {
            this.form.get(Controls.IPv6PodsCIDR).setValue(networkDefaults.ipv6.podsCidr);
          }
          if (networkDefaults.ipv6?.servicesCidr) {
            this.form.get(Controls.IPv6ServicesCIDR).setValue(networkDefaults.ipv6.servicesCidr);
          }
          if (networkDefaults.ipv6?.nodeCidrMaskSize) {
            this.form.get(Controls.IPv6CIDRMaskSize).setValue(networkDefaults.ipv6.nodeCidrMaskSize);
          }
          this.form.get(Controls.NodeLocalDNSCache).setValue(!!networkDefaults.nodeLocalDNSCacheEnabled);
          if (this.isAllowedIPRangeSupported()) {
            this.form
              .get(Controls.IPv4AllowedIPRange)
              .setValue(networkDefaults.ipv4?.nodePortsAllowedIPRange || this._defaultAllowedIPRange);
            this.form.get(Controls.IPv6AllowedIPRange).setValue(networkDefaults.ipv6?.nodePortsAllowedIPRange);
          } else {
            this.form.get(Controls.IPv4AllowedIPRange).setValue(null);
            this.form.get(Controls.IPv6AllowedIPRange).setValue(null);
          }
        },
      });
  }

  private _getExtraCloudSpecOptions(): ExtraCloudSpecOptions {
    return (
      this._clusterSpecService.cluster?.spec?.cloud[this._clusterSpecService.provider] || ({} as ExtraCloudSpecOptions)
    );
  }

  private _getClusterEntity(): Cluster {
    const ipv4Pods = this.controlValue(Controls.IPv4PodsCIDR);
    const ipv4Services = this.controlValue(Controls.IPv4ServicesCIDR);
    const cniPluginType = this.controlValue(Controls.CNIPlugin);
    const cniPluginVersion = this.controlValue(Controls.CNIPluginVersion);
    const cniPlugin = cniPluginType ? {type: cniPluginType, version: cniPluginVersion} : null;
    const konnectivity = this.isKonnectivityEnabled ? this.controlValue(Controls.Konnectivity) : null;
    const clusterNetwork = {
      ipFamily: this.controlValue(Controls.IPFamily),
      proxyMode: this.controlValue(Controls.ProxyMode),
      pods: {cidrBlocks: ipv4Pods ? [ipv4Pods] : []},
      services: {cidrBlocks: ipv4Services ? [ipv4Services] : []},
      nodeCidrMaskSizeIPv4: this.controlValue(Controls.IPv4CIDRMaskSize),
      nodeLocalDNSCacheEnabled: this.controlValue(Controls.NodeLocalDNSCache),
      konnectivityEnabled: konnectivity,
    } as ClusterNetwork;

    if (this.isDualStackNetworkTypeSelected()) {
      const ipv6Pods = this.controlValue(Controls.IPv6PodsCIDR);
      if (ipv6Pods) {
        clusterNetwork.pods.cidrBlocks = [...(ipv4Pods ? clusterNetwork.pods.cidrBlocks : ['']), ipv6Pods];
      }
      const ipv6Services = this.controlValue(Controls.IPv6ServicesCIDR);
      if (ipv6Services) {
        clusterNetwork.services.cidrBlocks = [
          ...(ipv4Services ? clusterNetwork.services.cidrBlocks : ['']),
          ipv6Services,
        ];
      }
      clusterNetwork.nodeCidrMaskSizeIPv6 = this.controlValue(Controls.IPv6CIDRMaskSize);
    }

    return {
      name: this.controlValue(Controls.Name),
      spec: {
        version: this.controlValue(Controls.Version),
        auditLogging: {
          enabled: this.controlValue(Controls.AuditLogging),
          policyPreset: this.controlValue(Controls.AuditPolicyPreset),
        },
        opaIntegration: {
          enabled: this.controlValue(Controls.OPAIntegration),
        },
        mla: {
          loggingEnabled: this.controlValue(Controls.MLALogging),
          monitoringEnabled: this.controlValue(Controls.MLAMonitoring),
        },
        enableUserSSHKeyAgent: this.controlValue(Controls.UserSSHKeyAgent),
        enableOperatingSystemManager: this.controlValue(Controls.OperatingSystemManager),
        containerRuntime: this.controlValue(Controls.ContainerRuntime),
        clusterNetwork,
        cniPlugin: cniPlugin,
      } as ClusterSpec,
    } as Cluster;
  }
}
