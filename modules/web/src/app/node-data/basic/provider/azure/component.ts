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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {distinctUntilChanged, filter, skipWhile, switchMap, takeUntil, tap} from 'rxjs/operators';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';
import {PresetsService} from '@core/services/wizard/presets';
import {AzureNodeSpec, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {AzureSizes, AzureZones} from '@shared/entity/provider/azure';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {compare} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {ProjectResourceQuotaPayload} from '@shared/entity/quota';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ComboboxControls} from '@shared/components/combobox/component';

enum Controls {
  Size = 'size',
  Zone = 'zone',
  ImageID = 'imageID',
  OSDiskSize = 'osDiskSize',
  DataDiskSize = 'dataDiskSize',
}

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading sizes...',
  Empty = 'No Sizes Available',
}

enum ZoneState {
  Ready = 'Zone',
  Loading = 'Loading zones...',
  Empty = 'No Zones Available',
}

@Component({
  selector: 'km-azure-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AzureBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AzureBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AzureBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _sizeChanges = new EventEmitter<boolean>();
  private readonly _defaultDiskSize = 30;

  readonly Controls = Controls;

  sizes: AzureSizes[] = [];
  zones: Array<{name: string}> = [];
  sizeLabel = SizeState.Empty;
  zoneLabel = ZoneState.Empty;
  selectedSize = '';
  selectedZone = '';

  private get _sizesObservable(): Observable<AzureSizes[]> {
    return this._nodeDataService.azure.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  private get _zonesObservable(): Observable<AzureZones> {
    return this._nodeDataService.azure.zones(this._clearZone.bind(this), this._onZoneLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _quotaCalculationService: QuotaCalculationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
      [Controls.Zone]: this._builder.control(''),
      [Controls.ImageID]: this._builder.control(''),
      [Controls.OSDiskSize]: this._builder.control(this.defaultOSDiskSize(), Validators.required),
      [Controls.DataDiskSize]: this._builder.control(this._defaultDiskSize, Validators.required),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(this._clearSize.bind(this));

    this._nodeDataService.operatingSystemChanges
      .pipe(distinctUntilChanged())
      .pipe(tap(_ => this.form.get(Controls.OSDiskSize).setValue(this.defaultOSDiskSize())))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._cdr.detectChanges());

    this._sizeChanges
      .pipe(tap(_ => this._clearZone()))
      .pipe(filter(hasValue => hasValue))
      .pipe(switchMap(_ => this._zonesObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setZones.bind(this));

    merge(
      this.form.get(Controls.ImageID).valueChanges,
      this.form.get(Controls.OSDiskSize).valueChanges,
      this.form.get(Controls.DataDiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    const size$ = this.form
      .get(Controls.Size)
      .valueChanges.pipe(skipWhile(value => !value?.[ComboboxControls.Select]))
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any) => prev?.[ComboboxControls.Select] === curr?.[ComboboxControls.Select]
        )
      );

    size$.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._quotaCalculationService.quotaPayload = this._getQuotaCalculationPayload();
      this._quotaCalculationService.refreshQuotaCalculations();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.azure.size = size;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    this._sizeChanges.emit(!!size);
  }

  isZoneEnabled(): boolean {
    return (
      this._clusterSpecService.cluster.spec.cloud.azure &&
      !this._clusterSpecService.cluster.spec.cloud.azure.assignAvailabilitySet
    );
  }

  onZoneChange(zone: string): void {
    this._nodeDataService.nodeData.spec.cloud.azure.zones = [zone];
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  getZoneHint(): string {
    if (!this.isZoneEnabled()) {
      return 'Assigning availability zones is disabled in this cluster.';
    } else if (!this._nodeDataService.nodeData.spec.cloud.azure.size) {
      return 'Please select node size first.';
    }
    return '';
  }

  sizeDisplayName(sizeName: string): string {
    const size = this.sizes.find(size => size.name === sizeName);
    return size ? this.getSizeDisplayName(size) : sizeName;
  }

  getSizeDisplayName(s: AzureSizes): string {
    const gpu = s.numberOfGPUs > 0 ? ` ${s.numberOfGPUs} GPU,` : '';
    return `${s.name} (${s.numberOfCores} vCPU,${gpu} ${s.memoryInMB} MB RAM)`;
  }

  defaultOSDiskSize(): number {
    const defaultDiskSizeRHEL = 64;

    const selectedOSDiskSize = this._nodeDataService.nodeData.spec?.cloud?.azure?.osDiskSize;

    if (selectedOSDiskSize) {
      return this._nodeDataService.operatingSystem === OperatingSystem.RHEL && selectedOSDiskSize < defaultDiskSizeRHEL
        ? defaultDiskSizeRHEL
        : selectedOSDiskSize;
    }

    return this._nodeDataService.operatingSystem === OperatingSystem.RHEL ? defaultDiskSizeRHEL : this._defaultDiskSize;
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.azure) {
      const selectedZones = this._nodeDataService.nodeData.spec.cloud.azure.zones;
      this.selectedZone = selectedZones && selectedZones.length > 0 ? selectedZones[0] : '';

      this.form.get(Controls.ImageID).setValue(this._nodeDataService.nodeData.spec.cloud.azure.imageID);
      this.form
        .get(Controls.OSDiskSize)
        .setValue(this._nodeDataService.nodeData.spec.cloud.azure.osDiskSize || this.defaultOSDiskSize());
      this.form
        .get(Controls.DataDiskSize)
        .setValue(this._nodeDataService.nodeData.spec.cloud.azure.dataDiskSize || this._defaultDiskSize);

      this._cdr.detectChanges();
    }
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _onZoneLoading(): void {
    this._clearZone();
    this.zoneLabel = ZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this.sizes = [];
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _clearZone(): void {
    this.zones = [];
    this.zoneLabel = ZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: AzureSizes[]): void {
    this.sizes = sizes;
    this.selectedSize = this._nodeDataService.nodeData.spec.cloud.azure.size;

    if (!this.selectedSize && this.sizes.length > 0) {
      this.selectedSize = this._findCheapestInstance(sizes).name;
    }

    this.sizeLabel = this.selectedSize ? SizeState.Ready : SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setZones(zones: AzureZones): void {
    if (zones && zones.zones) {
      this.zones = _.sortBy(zones.zones, s => s.toLowerCase()).map(zone => ({name: zone}));
    }

    if (this.selectedZone) {
      this.form.get(Controls.Zone).setValue(this.selectedZone);
    }

    this.zoneLabel = this.zones && this.zones.length > 0 ? ZoneState.Ready : ZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _findCheapestInstance(instanceTypes: AzureSizes[]): AzureSizes {
    // Avoid mutating original array
    return [...instanceTypes]
      .sort((a, b) => compare(a.memoryInMB, b.memoryInMB))
      .sort((a, b) => compare(a.numberOfCores, b.numberOfCores))[0];
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          azure: {
            imageID: this.form.get(Controls.ImageID).value,
            osDiskSize: this.form.get(Controls.OSDiskSize).value,
            dataDiskSize: this.form.get(Controls.DataDiskSize).value,
          } as AzureNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ProjectResourceQuotaPayload {
    const size = this._nodeDataService.nodeData.spec.cloud.azure.size;
    const selectedSize = this.sizes.find(s => s.name === size);
    return {
      replicas: this._nodeDataService.nodeData.count,
      diskSizeGB: this.form.get(Controls.Size)?.[ComboboxControls.Select],
      azureSize: {
        ...selectedSize,
      } as AzureSizes,
    };
  }
}