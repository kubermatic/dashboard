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
import {Observable} from 'rxjs';
import {filter, switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {AzureNodeSpec, NodeCloudSpec, NodeSpec} from '../../../../shared/entity/node';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';
import {AzureSizes, AzureZones} from '../../../../shared/entity/provider/azure';

enum Controls {
  Size = 'size',
  Zone = 'zone',
  ImageID = 'imageID',
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
  readonly Controls = Controls;
  sizes: AzureSizes[] = [];
  zones: Array<{name: string}> = [];
  sizeLabel = SizeState.Empty;
  zoneLabel = ZoneState.Empty;
  selectedSize = '';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
      [Controls.Zone]: this._builder.control(''),
      [Controls.ImageID]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(this._clearSize.bind(this));

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));

    this._sizeChanges
      .pipe(filter(hasValue => hasValue))
      .pipe(switchMap(_ => this._zonesObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setZones.bind(this));

    this.form
      .get(Controls.ImageID)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.azure.size = size;
    this._sizeChanges.emit(!!size);
  }

  onZoneChange(zone: string): void {
    this._nodeDataService.nodeData.spec.cloud.azure.zone = zone;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.Zone:
        return this._nodeDataService.nodeData.spec.cloud.azure.size !== '' ? '' : 'Please enter your Node Size first.';
    }
  }

  private get _sizesObservable(): Observable<AzureSizes[]> {
    return this._nodeDataService.azure.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  private get _zonesObservable(): Observable<AzureZones> {
    return this._nodeDataService.azure.zones(this._clearZone.bind(this), this._onZoneLoading.bind(this));
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
    this.selectedSize = '';
    this.sizeLabel = SizeState.Empty;

    if (this.sizes.length > 0) {
      this.selectedSize = this.sizes[0].name;
      this.sizeLabel = SizeState.Ready;
    }

    this._cdr.detectChanges();
  }

  private _setZones(zones: AzureZones): void {
    this.zones = zones.zones.sort((a, b) => a.localeCompare(b)).map(zone => ({name: zone}));
    this.zoneLabel = this.zones.length > 0 ? ZoneState.Ready : ZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          azure: {
            imageID: this.form.get(Controls.ImageID).value,
          } as AzureNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
