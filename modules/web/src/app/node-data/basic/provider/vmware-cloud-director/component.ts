// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {SettingsService} from '@app/core/services/settings';
import {PresetsService} from '@app/core/services/wizard/presets';
import {DynamicModule} from '@app/dynamic/module-registry';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';
import {Datacenter} from '@shared/entity/datacenter';
import {getDefaultNodeProviderSpec, NodeCloudSpec, NodeSpec, VMwareCloudDirectorNodeSpec} from '@shared/entity/node';
import {
  VMwareCloudDirectorCatalog,
  VMwareCloudDirectorComputePolicy,
  VMwareCloudDirectorIPAllocationMode,
  VMwareCloudDirectorStorageProfile,
  VMwareCloudDirectorTemplate,
} from '@shared/entity/provider/vmware-cloud-director';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, Observable, Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  CPUs = 'cpus',
  CPUCores = 'cpuCores',
  MemoryMB = 'memoryMB',
  DiskSizeGB = 'diskSizeGB',
  DiskIOPs = 'diskIOPs',
  IPAllocationMode = 'ipAllocationMode',
  StorageProfile = 'storageProfile',
  Catalog = 'catalog',
  PlacementPolicy = 'placementPolicy',
  SizingPolicy = 'sizingPolicy',
  Template = 'template',
  Network = 'network',
  AdditionalNetworks = 'additionalNetworks',
}

enum StorageProfileState {
  Ready = 'Storage Profile',
  Loading = 'Loading...',
  Empty = 'No storage profiles available',
}

enum TemplateState {
  Ready = 'Template',
  Loading = 'Loading...',
  Empty = 'No templates available',
}

enum CatalogState {
  Ready = 'Catalog',
  Loading = 'Loading...',
  Empty = 'No catalogs available',
}

enum PlacementPolicyState {
  Ready = 'Placement Policy',
  Loading = 'Loading...',
  Empty = 'No placement policies available',
}

enum SizingPolicyState {
  Ready = 'Sizing Policy',
  Loading = 'Loading...',
  Empty = 'No sizing policies available',
}

enum NetworkState {
  Ready = 'Network',
  Loading = 'Loading...',
  Empty = 'No networks available',
}

@Component({
  selector: 'km-vmware-cloud-director-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VMwareCloudDirectorBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VMwareCloudDirectorBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class VMwareCloudDirectorBasicNodeDataComponent
  extends BaseFormValidator
  implements OnInit, AfterViewChecked, OnDestroy
{
  readonly Controls = Controls;
  ipAllocationModes: string[] = [VMwareCloudDirectorIPAllocationMode.POOL, VMwareCloudDirectorIPAllocationMode.DHCP];

  @ViewChild('storageProfileCombobox')
  private readonly _storageProfileCombobox: FilteredComboboxComponent;
  @ViewChild('catalogCombobox')
  private readonly _catalogCombobox: FilteredComboboxComponent;
  @ViewChild('templateCombobox')
  private readonly _templateCombobox: FilteredComboboxComponent;
  @ViewChild('placementPolicyCombobox')
  private readonly _placementPolicyCombobox: FilteredComboboxComponent;
  @ViewChild('sizingPolicyCombobox')
  private readonly _sizingPolicyCombobox: FilteredComboboxComponent;

  storageProfiles: VMwareCloudDirectorStorageProfile[] = [];
  catalogs: VMwareCloudDirectorCatalog[] = [];
  templates: VMwareCloudDirectorTemplate[] = [];
  computePolicies: VMwareCloudDirectorComputePolicy[] = [];
  networks: string[] = [];

  selectedStorageProfile = '';
  selectedPlacementPolicy = '';
  selectedSizingPolicy = '';
  selectedCatalog = '';
  selectedTemplate = '';
  storageProfileLabel = StorageProfileState.Empty;
  templateLabel = TemplateState.Empty;
  catalogLabel = CatalogState.Empty;
  placementPolicyLabel = PlacementPolicyState.Empty;
  sizingPolicyLabel = SizingPolicyState.Empty;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  networkLabel = NetworkState.Empty;
  isPresetSelected = false;

  private _catalogChanges = new Subject<boolean>();
  private _datacenter: Datacenter;
  private _quotaCalculationService: QuotaCalculationService;
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _presets: PresetsService,
    private readonly _settingsService: SettingsService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  get placementPolicies(): VMwareCloudDirectorComputePolicy[] {
    return this.computePolicies.filter(policy => !policy.isSizingOnly);
  }

  get sizingPolicies(): VMwareCloudDirectorComputePolicy[] {
    return this.computePolicies.filter(policy => policy.isSizingOnly);
  }

  ngOnInit(): void {
    this._initForm();

    this._nodeDataService.nodeData = this._getNodeData();

    this._datacenterService
      .getDatacenter(this._clusterSpecService.datacenter)
      .pipe(take(1))
      .subscribe(datacenter => (this._datacenter = datacenter));

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSizeGB).valueChanges,
      this.form.get(Controls.DiskIOPs).valueChanges,
      this.form.get(Controls.IPAllocationMode).valueChanges,
      this.form.get(Controls.Network).valueChanges,
      this.form.get(Controls.AdditionalNetworks).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSizeGB).valueChanges,
      this.form.get(Controls.IPAllocationMode).valueChanges,
      this.form.get(Controls.StorageProfile).valueChanges,
      this.form.get(Controls.Template).valueChanges,
      this.form.get(Controls.Catalog).valueChanges,
      this.form.get(Controls.PlacementPolicy).valueChanges,
      this.form.get(Controls.SizingPolicy).valueChanges,
      this.form.get(Controls.Network).valueChanges,
      this.form.get(Controls.AdditionalNetworks).valueChanges
    )
      .pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        this._quotaCalculationService.refreshQuotaCalculations(payload);
      });

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.datacenter)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: datacenter => {
          this._datacenter = datacenter;
        },
      });

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(value => !!(value && this._datacenter && this.templates?.length)))
      .pipe(
        tap(_ => {
          const templates = this.templates;
          this._clearTemplate();
          this.templates = templates;
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultTemplate(this.templates));

    this._storageProfilesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultStorageProfile.bind(this));

    this._computePoliciesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultComputePolicy.bind(this));

    this._catalogsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultCatalog.bind(this));

    this._catalogChanges
      .pipe(tap(hasValue => !hasValue && this._clearTemplate()))
      .pipe(filter(hasValue => !!hasValue))
      .pipe(switchMap(_ => this._templatesObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultTemplate.bind(this));

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => (this.isPresetSelected = !!preset));

    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      const selectedPreset = preset?.providers.find(provider => provider.name === NodeProvider.VMWARECLOUDDIRECTOR);
      if (selectedPreset) {
        if (selectedPreset.vmwareCloudDirector?.ovdcNetwork) {
          this.networks = [selectedPreset.vmwareCloudDirector.ovdcNetwork];
        } else if (selectedPreset.vmwareCloudDirector?.ovdcNetworks) {
          this.networks = selectedPreset.vmwareCloudDirector.ovdcNetworks;
        }
      }
      this.networkLabel = this.networks?.length ? NetworkState.Ready : NetworkState.Empty;
      this.updateSelectedNetwork();
    });

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this.isPresetSelected) {
          return;
        }
        this.setNetworksFromClusterSpec();
        this.networkLabel = this.networks?.length ? NetworkState.Ready : NetworkState.Empty;
        this.updateSelectedNetwork();
      });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (settings.providerConfiguration?.vmwareCloudDirector?.ipAllocationModes?.length > 0) {
        this.ipAllocationModes = settings.providerConfiguration.vmwareCloudDirector.ipAllocationModes;
        if (!this.ipAllocationModes.includes(this.form.get(Controls.IPAllocationMode).value)) {
          this.form.get(Controls.IPAllocationMode).setValue(this.ipAllocationModes[0]);
          this.form.updateValueAndValidity();
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onStorageProfileChanged(storageProfile: string): void {
    this.selectedStorageProfile = storageProfile;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.storageProfile = storageProfile;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onPlacementPolicyChanged(placementPolicy: string): void {
    this.selectedPlacementPolicy = placementPolicy;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.placementPolicy = placementPolicy;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onSizingPolicyChanged(sizingPolicy: string): void {
    this.selectedSizingPolicy = sizingPolicy;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.sizingPolicy = sizingPolicy;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onCatalogChanged(catalog: string): void {
    this.selectedCatalog = catalog;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog = catalog;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    this._catalogChanges.next(!!catalog);
  }

  onNetworkChanged(network: string): void {
    const additionalNetworksControl = this.form.get(Controls.AdditionalNetworks);

    if (additionalNetworksControl.value && additionalNetworksControl.value.includes(network)) {
      additionalNetworksControl.setValue(additionalNetworksControl.value.filter(n => n !== network));
    }

    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.network = network;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onAdditionalNetworkChanged(networks: string[]): void {
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.additionalNetworks = networks;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onTemplateChanged(template: string): void {
    this.selectedTemplate = template;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.template = template;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  updateSelectedNetwork(): void {
    const networkControl = this.form.get(Controls.Network);
    const additionalNetworksControl = this.form.get(Controls.AdditionalNetworks);

    additionalNetworksControl.setValue(additionalNetworksControl.value.filter(n => this.networks.includes(n)));

    if (networkControl.value && this.networks.includes(networkControl.value)) {
      return;
    }
    networkControl.setValue(this.networks[0]);
    this.form.updateValueAndValidity();
  }

  private _initForm(): void {
    const values = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector;
    const defaults = getDefaultNodeProviderSpec(NodeProvider.VMWARECLOUDDIRECTOR) as VMwareCloudDirectorNodeSpec;
    const defaultIPAllocationMode =
      this.ipAllocationModes?.length === 1 ? this.ipAllocationModes[0] : defaults.ipAllocationMode;
    this.setNetworksFromClusterSpec();

    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control(values ? values.cpus : defaults.cpus, [Validators.required]),
      [Controls.CPUCores]: this._builder.control(values ? values.cpuCores : defaults.cpuCores, [Validators.required]),
      [Controls.MemoryMB]: this._builder.control(values ? values.memoryMB : defaults.memoryMB, [Validators.required]),
      [Controls.DiskSizeGB]: this._builder.control(values ? values.diskSizeGB : defaults.diskSizeGB, [
        Validators.required,
      ]),
      [Controls.DiskIOPs]: this._builder.control(values ? values.diskIOPS : defaults.diskIOPS),
      [Controls.IPAllocationMode]: this._builder.control(values ? values.ipAllocationMode : defaultIPAllocationMode),
      [Controls.StorageProfile]: this._builder.control(values ? values.storageProfile : defaults.storageProfile, [
        Validators.required,
      ]),
      [Controls.Template]: this._builder.control(values ? values.template : defaults.template, [Validators.required]),
      [Controls.Catalog]: this._builder.control(values ? values.catalog : defaults.catalog, [Validators.required]),
      [Controls.PlacementPolicy]: this._builder.control(values ? values.placementPolicy : defaults.placementPolicy),
      [Controls.SizingPolicy]: this._builder.control(values ? values.sizingPolicy : defaults.sizingPolicy),
      [Controls.Network]: this._builder.control(values?.network ?? this.networks[0], Validators.required),
      [Controls.AdditionalNetworks]: this._builder.control(values?.additionalNetworks ?? defaults.additionalNetworks),
    });
  }

  private get _storageProfilesObservable(): Observable<VMwareCloudDirectorStorageProfile[]> {
    return this._nodeDataService.vmwareclouddirector.storageProfiles(
      this._clearStorageProfile.bind(this),
      this._onStorageProfileLoading.bind(this)
    );
  }

  private get _computePoliciesObservable(): Observable<VMwareCloudDirectorComputePolicy[]> {
    return this._nodeDataService.vmwareclouddirector.computePolicies(
      this._clearComputePolicy.bind(this),
      this._onComputePolicyLoading.bind(this)
    );
  }

  private get _catalogsObservable(): Observable<VMwareCloudDirectorCatalog[]> {
    return this._nodeDataService.vmwareclouddirector.catalogs(
      this._clearCatalog.bind(this),
      this._onCatalogLoading.bind(this)
    );
  }

  private get _templatesObservable(): Observable<VMwareCloudDirectorTemplate[]> {
    return this._nodeDataService.vmwareclouddirector.templates(
      this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog,
      this._clearTemplate.bind(this),
      this._onTemplateLoading.bind(this)
    );
  }

  private _onStorageProfileLoading(): void {
    this.storageProfileLabel = StorageProfileState.Loading;
    this._cdr.detectChanges();
  }

  private _onComputePolicyLoading(): void {
    this.placementPolicyLabel = PlacementPolicyState.Loading;
    this.sizingPolicyLabel = SizingPolicyState.Loading;

    this._cdr.detectChanges();
  }

  private _clearStorageProfile(): void {
    this.selectedStorageProfile = '';
    this.storageProfiles = [];
    this.storageProfileLabel = StorageProfileState.Empty;
    this._storageProfileCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearComputePolicy(): void {
    this.selectedPlacementPolicy = '';
    this.selectedSizingPolicy = '';
    this.computePolicies = [];
    this.placementPolicyLabel = PlacementPolicyState.Empty;
    this.sizingPolicyLabel = SizingPolicyState.Empty;
    this._placementPolicyCombobox.reset();
    this._sizingPolicyCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultStorageProfile(storageProfiles: VMwareCloudDirectorStorageProfile[]): void {
    this.storageProfiles = storageProfiles;
    this.selectedStorageProfile = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.storageProfile;
    const dcStorageProfile = this._datacenter?.spec.vmwareclouddirector?.storageProfile;

    if (
      this.selectedStorageProfile &&
      !storageProfiles?.find(profile => profile.name === this.selectedStorageProfile)
    ) {
      this.selectedStorageProfile = '';
    }

    if (
      !this.selectedStorageProfile &&
      dcStorageProfile &&
      this.storageProfiles?.find(profile => profile.name === dcStorageProfile)
    ) {
      this.selectedStorageProfile = dcStorageProfile;
    }

    this.storageProfileLabel = storageProfiles?.length ? StorageProfileState.Ready : StorageProfileState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultComputePolicy(computePolicies: VMwareCloudDirectorComputePolicy[]): void {
    this.computePolicies = computePolicies;
    this.selectedPlacementPolicy = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector?.placementPolicy;
    this.selectedSizingPolicy = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector?.sizingPolicy;

    if (
      this.selectedPlacementPolicy &&
      !computePolicies?.find(policy => policy.name === this.selectedPlacementPolicy)
    ) {
      this.selectedPlacementPolicy = '';
    }

    if (this.selectedSizingPolicy && !computePolicies?.find(policy => policy.name === this.selectedSizingPolicy)) {
      this.selectedSizingPolicy = '';
    }

    this.placementPolicyLabel = computePolicies?.length ? PlacementPolicyState.Ready : PlacementPolicyState.Empty;
    this.sizingPolicyLabel = computePolicies?.length ? SizingPolicyState.Ready : SizingPolicyState.Empty;
    this._cdr.detectChanges();
  }

  private _onCatalogLoading(): void {
    this.catalogLabel = CatalogState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCatalog(): void {
    this.selectedCatalog = '';
    this.catalogs = [];
    this.catalogLabel = CatalogState.Empty;
    this._catalogCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultCatalog(catalogs: VMwareCloudDirectorCatalog[]): void {
    this.catalogs = catalogs;
    this.selectedCatalog = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog;
    const dcCatalog = this._datacenter?.spec.vmwareclouddirector?.catalog;

    if (this.selectedCatalog && !catalogs?.find(catalog => catalog.name === this.selectedCatalog)) {
      this.selectedCatalog = '';
      this._clearTemplate();
    }

    if (!this.selectedCatalog && dcCatalog && catalogs?.find(catalog => catalog.name === dcCatalog)) {
      this.selectedCatalog = dcCatalog;
    }

    this.catalogLabel = catalogs?.length ? CatalogState.Ready : CatalogState.Empty;
    this._cdr.detectChanges();
  }

  private _onTemplateLoading(): void {
    this.templateLabel = TemplateState.Loading;
    this._cdr.detectChanges();
  }

  private _clearTemplate(): void {
    this.selectedTemplate = '';
    this.templates = [];
    this.templateLabel = TemplateState.Empty;
    this._templateCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultTemplate(templates: VMwareCloudDirectorTemplate[]): void {
    this.templates = templates;
    this.selectedTemplate = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.template;
    const selectedOS = this._nodeDataService.operatingSystem;
    const dcTemplate = this._datacenter?.spec.vmwareclouddirector?.templates?.[selectedOS];

    if (this.selectedTemplate && !templates?.find(template => template.name === this.selectedTemplate)) {
      this.selectedTemplate = '';
    }
    if (!this.selectedTemplate && dcTemplate && templates?.find(template => template.name === dcTemplate)) {
      this.selectedTemplate = dcTemplate;
    }

    this.templateLabel = templates?.length ? TemplateState.Ready : TemplateState.Empty;
    this._cdr.detectChanges();
  }

  private setNetworksFromClusterSpec(): void {
    if (this._clusterSpecService.cluster.spec.cloud?.vmwareclouddirector?.ovdcNetworks) {
      this.networks = this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.ovdcNetworks;
    } else if (this._clusterSpecService.cluster.spec.cloud?.vmwareclouddirector?.ovdcNetwork) {
      this.networks = [this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.ovdcNetwork];
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vmwareclouddirector: {
            cpus: this.form.get(Controls.CPUs).value,
            cpuCores: this.form.get(Controls.CPUCores).value,
            memoryMB: this.form.get(Controls.MemoryMB).value,
            diskSizeGB: this.form.get(Controls.DiskSizeGB).value,
            diskIOPS: this.form.get(Controls.DiskIOPs).value,
            ipAllocationMode: this.form.get(Controls.IPAllocationMode).value,
            network: this.form.get(Controls.Network).value,
            additionalNetworks: this.form.get(Controls.AdditionalNetworks).value,
          } as VMwareCloudDirectorNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      vmDirectorNodeSpec: {
        [Controls.CPUs]: this.form.get(Controls.CPUs).value,
        [Controls.CPUCores]: this.form.get(Controls.CPUCores).value,
        [Controls.MemoryMB]: this.form.get(Controls.MemoryMB).value,
        [Controls.DiskSizeGB]: this.form.get(Controls.DiskSizeGB).value,
        [Controls.DiskIOPs]: this.form.get(Controls.DiskIOPs).value,
        [Controls.IPAllocationMode]: this.form.get(Controls.IPAllocationMode).value,
        [Controls.StorageProfile]: this.form.get(Controls.StorageProfile).value?.[ComboboxControls.Select],
        [Controls.Template]: this.form.get(Controls.Template).value?.[ComboboxControls.Select],
        [Controls.Catalog]: this.form.get(Controls.Catalog).value?.[ComboboxControls.Select],
        [Controls.PlacementPolicy]: this.form.get(Controls.PlacementPolicy).value?.[ComboboxControls.Select],
        [Controls.SizingPolicy]: this.form.get(Controls.SizingPolicy).value?.[ComboboxControls.Select],
        [Controls.Network]: this.form.get(Controls.Network).value,
        [Controls.AdditionalNetworks]: this.form.get(Controls.AdditionalNetworks).value,
      } as VMwareCloudDirectorNodeSpec,
    };

    if (
      !this._nodeDataService.isInWizardMode() &&
      !this._initialQuotaCalculationPayload &&
      !!this._nodeDataService.nodeData.creationTimestamp
    ) {
      this._initialQuotaCalculationPayload = {
        ...payload,
      };
    }

    if (this._initialQuotaCalculationPayload) {
      payload = {
        ...payload,
        replacedResources: this._initialQuotaCalculationPayload,
      } as ResourceQuotaCalculationPayload;
    }

    return payload;
  }
}
