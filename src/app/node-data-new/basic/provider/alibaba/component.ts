import {AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {FilteredComboboxComponent} from '../../../../shared/components/combobox/component';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {AlibabaInstanceType, AlibabaZone} from '../../../../shared/entity/provider/alibaba/Alibaba';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

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
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AlibabaBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AlibabaBasicNodeDataComponent), multi: true}
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlibabaBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewChecked, OnDestroy {
  private _diskTypes: string[] = ['cloud', 'cloud_efficiency', 'cloud_ssd', 'cloud_essd', 'san_ssd', 'san_efficiency'];

  readonly Controls = Controls;

  instanceTypes: AlibabaInstanceType[] = [];
  selectedInstanceType = '';
  instanceTypeLabel = InstanceTypeState.Empty;
  zones: AlibabaZone[] = [];
  selectedZone = '';
  zoneLabel = ZoneState.Empty;
  diskTypes = this._diskTypes.map(type => ({name: type}));
  selectedDiskType = '';

  @ViewChild('instanceTypeCombobox') private _instanceTypeCombobox: FilteredComboboxComponent;
  @ViewChild('zoneCombobox') private _zoneCombobox: FilteredComboboxComponent;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _nodeDataService: NodeDataService, private readonly _cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control('', Validators.required),
      [Controls.InternetMaxBandwidthOut]: this._builder.control('', Validators.required),
      [Controls.VSwitchID]: this._builder.control('', Validators.required),
      [Controls.ZoneID]: this._builder.control('', Validators.required),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._instanceTypesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultInstanceType.bind(this));
    this._zoneIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultZone.bind(this));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._clearInstanceType();
      this._clearZone();
    });

    merge(
        this.form.get(Controls.DiskSize).valueChanges,
        this.form.get(Controls.InternetMaxBandwidthOut).valueChanges,
        this.form.get(Controls.VSwitchID).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
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
  }

  onZoneChange(zone: string): void {
    this._nodeDataService.nodeData.spec.cloud.alibaba.zoneID = zone;
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.alibaba.diskType = diskType;
  }

  private get _instanceTypesObservable(): Observable<AlibabaInstanceType[]> {
    return this._nodeDataService.alibaba.instanceTypes(
        this._clearInstanceType.bind(this), this._onInstanceTypeLoading.bind(this));
  }

  private get _zoneIdsObservable(): Observable<AlibabaZone[]> {
    return this._nodeDataService.alibaba.zones(this._clearZone.bind(this), this._onZoneLoading.bind(this));
  }

  private _onInstanceTypeLoading(): void {
    this._clearInstanceType();
    this.instanceTypeLabel = InstanceTypeState.Loading;
    this._cdr.detectChanges();
  }

  private _onZoneLoading(): void {
    this._clearZone();
    this.zoneLabel = ZoneState.Loading;
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

  private _setDefaultInstanceType(instanceTypes: AlibabaInstanceType[]): void {
    this.instanceTypes = instanceTypes.sort((a, b) => a.id.localeCompare(b.id));
    if (this.instanceTypes.length > 0) {
      this.instanceTypeLabel = InstanceTypeState.Ready;
      this.selectedInstanceType = this.instanceTypes[0].id;
      this._cdr.detectChanges();
    }
  }

  private _setDefaultZone(zones: AlibabaZone[]): void {
    this.zones = zones.sort((a, b) => a.id.localeCompare(b.id));
    if (this.zones.length > 0) {
      this.zoneLabel = ZoneState.Ready;
      this.selectedZone = this.zones[0].id;
      this._cdr.detectChanges();
    }
  }

  private _setDefaultDiskType(): void {
    if (this.diskTypes.length > 0) {
      this.selectedDiskType = this.diskTypes[0].name;
      this._cdr.detectChanges();
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          alibaba: {
            diskSize: this.form.get(Controls.DiskSize).value,
            internetMaxBandwidthOut: this.form.get(Controls.InternetMaxBandwidthOut).value,
            vSwitchID: this.form.get(Controls.VSwitchID).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
