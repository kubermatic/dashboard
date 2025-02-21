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
import _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {compare} from '@shared/utils/common';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {PresetsService} from '@core/services/wizard/presets';
import {DynamicModule} from '@app/dynamic/module-registry';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {AlibabaInstanceType, AlibabaVSwitch, AlibabaZone} from '@shared/entity/provider/alibaba';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';

enum Controls {
  InstanceType = 'instanceType',
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  InternetMaxBandwidthOut = 'internetMaxBandwidthOut',
  VSwitchID = 'vSwitchID',
  ZoneID = 'zoneID',
}

enum InstanceTypeState {
  Ready = 'Instance Type',
  Loading = 'Loading...',
  Empty = 'No Instance Types Available',
}

enum ZoneState {
  Ready = 'Zone ID',
  Loading = 'Loading...',
  Empty = 'No Zones Available',
}

@Component({
    selector: 'km-alibaba-basic-node-data',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AlibabaBasicNodeDataComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AlibabaBasicNodeDataComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AlibabaBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewChecked, OnDestroy {
  private readonly _diskTypes: string[] = [
    'cloud',
    'cloud_efficiency',
    'cloud_ssd',
    'cloud_essd',
    'san_ssd',
    'san_efficiency',
  ];
  @ViewChild('instanceTypeCombobox')
  private _instanceTypeCombobox: FilteredComboboxComponent;
  @ViewChild('zoneCombobox')
  private _zoneCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;
  instanceTypes: AlibabaInstanceType[] = [];
  selectedInstanceType = '';
  instanceTypeLabel = InstanceTypeState.Empty;
  zones: AlibabaZone[] = [];
  selectedZone = '';
  zoneLabel = ZoneState.Empty;
  diskTypes = this._diskTypes.map(type => ({name: type}));
  selectedDiskType = '';
  vSwitches: string[] = [];
  isLoadingVSwitches = false;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;

  private _quotaCalculationService: QuotaCalculationService;
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  private get _instanceTypesObservable(): Observable<AlibabaInstanceType[]> {
    return this._nodeDataService.alibaba.instanceTypes(
      this._clearInstanceType.bind(this),
      this._onInstanceTypeLoading.bind(this)
    );
  }

  private get _zoneIdsObservable(): Observable<AlibabaZone[]> {
    return this._nodeDataService.alibaba.zones(this._clearZone.bind(this), this._onZoneLoading.bind(this));
  }

  private get _vSwitchIdsObservable(): Observable<AlibabaZone[]> {
    return this._nodeDataService.alibaba.vSwitches(this._clearVSwitch.bind(this), this._onVSwitchLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
      [Controls.DiskSize]: this._builder.control('40', Validators.required),
      [Controls.DiskType]: this._builder.control('', Validators.required),
      [Controls.InternetMaxBandwidthOut]: this._builder.control('10', Validators.required),
      [Controls.VSwitchID]: this._builder.control('', Validators.required),
      [Controls.ZoneID]: this._builder.control('', Validators.required),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._instanceTypesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultInstanceType.bind(this));
    this._zoneIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultZone.bind(this));
    this._vSwitchIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultVSwitch.bind(this));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._clearInstanceType();
      this._clearZone();
    });

    merge(this.form.get(Controls.DiskSize).valueChanges, this.form.get(Controls.InternetMaxBandwidthOut).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this.form
      .get(Controls.VSwitchID)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(vs => (this._nodeDataService.nodeData.spec.cloud.alibaba.vSwitchID = vs));

    merge(this.form.get(Controls.DiskSize).valueChanges, this.form.get(Controls.InstanceType).valueChanges)
      .pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        if (payload) {
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });
  }

  ngAfterViewChecked(): void {
    this._setDefaultDiskType();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onInstanceTypeChange(instanceType: string): void {
    this._nodeDataService.nodeData.spec.cloud.alibaba.instanceType = instanceType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onZoneChange(zone: string): void {
    this._nodeDataService.nodeData.spec.cloud.alibaba.zoneID = zone;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.alibaba.diskType = diskType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  getInstanceDisplayNameByID(instanceID: string): string {
    const instance = this.instanceTypes.find(instance => instance.id === instanceID);
    return instance ? this.getInstanceDisplayName(instance) : instanceID;
  }

  getInstanceDisplayName(it: AlibabaInstanceType) {
    const gpu = it.gpuCoreCount > 0 ? ` ${it.gpuCoreCount} GPU,` : '';
    return `${it.id} (${it.cpuCoreCount} CPU,${gpu} ${it.memorySize} GB RAM)`;
  }

  isDialogView(): boolean {
    // In the wizard we do not split extended and basic options.
    return !this._nodeDataService.isInWizardMode();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.alibaba) {
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.alibaba.diskSize);
      this.form
        .get(Controls.InternetMaxBandwidthOut)
        .setValue(this._nodeDataService.nodeData.spec.cloud.alibaba.internetMaxBandwidthOut);

      this._cdr.detectChanges();
    }
  }

  private _onInstanceTypeLoading(): void {
    this.instanceTypeLabel = InstanceTypeState.Loading;
    this._cdr.detectChanges();
  }

  private _onZoneLoading(): void {
    this.zoneLabel = ZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _onVSwitchLoading(): void {
    this.isLoadingVSwitches = true;
    this._cdr.detectChanges();
  }

  private _clearInstanceType(): void {
    this.instanceTypes = [];
    this.selectedInstanceType = '';
    this.instanceTypeLabel = InstanceTypeState.Empty;
    this._instanceTypeCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearZone(): void {
    this.zones = [];
    this.selectedZone = '';
    this.zoneLabel = ZoneState.Empty;
    this._zoneCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearVSwitch(): void {
    this.vSwitches = [];
    this.form.get(Controls.VSwitchID).setValue(AutocompleteInitialState);
    this._cdr.detectChanges();
  }

  private _setDefaultInstanceType(instanceTypes: AlibabaInstanceType[]): void {
    this.instanceTypes = _.sortBy(instanceTypes, it => it.id.toLowerCase());
    this.selectedInstanceType = this._nodeDataService.nodeData.spec.cloud.alibaba.instanceType;

    if (!this.selectedInstanceType && this.instanceTypes.length > 0) {
      this.selectedInstanceType = this._findCheapestInstance(instanceTypes).id;
    }

    this.instanceTypeLabel = this.selectedInstanceType ? InstanceTypeState.Ready : InstanceTypeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultZone(zones: AlibabaZone[]): void {
    this.zones = _.sortBy(zones, z => z.id.toLowerCase());
    this.selectedZone = this._nodeDataService.nodeData.spec.cloud.alibaba.zoneID;

    if (!this.selectedZone && this.zones.length > 0) {
      this.selectedZone = this.zones[0].id;
    }

    this.zoneLabel = this.selectedZone ? ZoneState.Ready : ZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultDiskType(): void {
    this.selectedDiskType = this._nodeDataService.nodeData.spec.cloud.alibaba.diskType;

    if (!this.selectedDiskType && this.diskTypes.length > 0) {
      this.selectedDiskType = this.diskTypes[0].name;
    }

    this._cdr.detectChanges();
  }

  private _setDefaultVSwitch(vSwitches: AlibabaVSwitch[]): void {
    this.isLoadingVSwitches = false;
    this.vSwitches = _.sortBy(vSwitches, it => it.id.toLowerCase()).map(it => it.id);
    let selectedVSwitch = this._nodeDataService.nodeData.spec.cloud.alibaba.vSwitchID;

    if (!selectedVSwitch && this.vSwitches.length > 0) {
      selectedVSwitch = this.vSwitches[0];
    }

    this.form.get(Controls.VSwitchID).setValue({main: selectedVSwitch});
    this._cdr.detectChanges();
  }

  private _findCheapestInstance(instanceTypes: AlibabaInstanceType[]): AlibabaInstanceType {
    // Avoid mutating original array
    return [...instanceTypes]
      .sort((a, b) => compare(a.memorySize, b.memorySize))
      .sort((a, b) => compare(a.cpuCoreCount, b.cpuCoreCount))[0];
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          alibaba: {
            diskSize: `${this.form.get(Controls.DiskSize).value}`,
            internetMaxBandwidthOut: `${this.form.get(Controls.InternetMaxBandwidthOut).value}`,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    const size = this._nodeDataService.nodeData.spec.cloud.alibaba.instanceType;
    const selectedInstanceType = this.instanceTypes.find(s => s.id === size);

    if (!selectedInstanceType) {
      return null;
    }

    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      diskSizeGB: this.form.get(Controls.DiskSize).value,
      alibabaInstanceType: {
        ...selectedInstanceType,
      } as AlibabaInstanceType,
    };

    if (
      this.isDialogView() &&
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
