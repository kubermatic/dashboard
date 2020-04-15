import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge, Observable, of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
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

@Component({
  selector: 'km-alibaba-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AlibabaBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AlibabaBasicNodeDataComponent), multi: true}
  ]
})
export class AlibabaBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _diskTypes: string[] = ['cloud', 'cloud_efficiency', 'cloud_ssd', 'cloud_essd', 'san_ssd', 'san_efficiency'];

  readonly Controls = Controls;

  instanceTypes: AlibabaInstanceType[] = [];
  zones: AlibabaZone[] = [];
  diskTypes = this._diskTypes.map(type => ({name: type}));
  defaultInstanceType = '';
  defaultZone = '';
  defaultDiskType = '';

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _nodeDataService: NodeDataService) {
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
    this._setDefaultDiskType();

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
    return this._nodeDataService.alibaba.instanceTypes().pipe(catchError(() => of<AlibabaInstanceType[]>()));
  }

  private get _zoneIdsObservable(): Observable<AlibabaZone[]> {
    return this._nodeDataService.alibaba.zones().pipe(catchError(() => of<AlibabaZone[]>()));
  }

  private _clearInstanceType(): void {
    this.instanceTypes = [];
  }

  private _setDefaultInstanceType(instanceTypes: AlibabaInstanceType[]): void {
    this.instanceTypes = instanceTypes.sort((a, b) => a.id.localeCompare(b.id));
    if (this.instanceTypes.length > 0) {
      this.defaultInstanceType = this.instanceTypes[0].id;
    }
  }

  private _clearZone(): void {
    this.zones = [];
  }

  private _setDefaultZone(zones: AlibabaZone[]): void {
    this.zones = zones.sort((a, b) => a.id.localeCompare(b.id));
    if (this.zones.length > 0) {
      this.defaultZone = this.zones[0].id;
    }
  }

  private _setDefaultDiskType(): void {
    if (this.diskTypes.length > 0) {
      this.defaultDiskType = this.diskTypes[0].name;
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
