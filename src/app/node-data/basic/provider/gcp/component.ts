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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import * as _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {FilteredComboboxComponent} from '../../../../shared/components/combobox/component';
import {GCPNodeSpec, NodeCloudSpec, NodeSpec} from '../../../../shared/entity/node';
import {GCPDiskType, GCPMachineSize, GCPZone} from '../../../../shared/entity/provider/gcp';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {compare} from '../../../../shared/utils/common-utils';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';

enum Controls {
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  Zone = 'zone',
  MachineType = 'machineType',
  Preemptible = 'preemptible',
}

enum ZoneState {
  Ready = 'Zone',
  Loading = 'Loading...',
  Empty = 'No Zones Available',
}

enum DiskTypeState {
  Ready = 'Disk Type',
  Loading = 'Loading...',
  Empty = 'No Disk Types Available',
}

enum MachineTypeState {
  Ready = 'Machine Type',
  Loading = 'Loading...',
  Empty = 'No Machine Types Available',
}

@Component({
  selector: 'km-gcp-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GCPBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GCPBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewInit, OnDestroy {
  private readonly _defaultDiskSize = 25;
  private _zoneChanges = new EventEmitter<boolean>();

  @ViewChild('zonesCombobox')
  private _zonesCombobox: FilteredComboboxComponent;
  @ViewChild('diskTypesCombobox')
  private _diskTypesCombobox: FilteredComboboxComponent;
  @ViewChild('machineTypesCombobox')
  private _machineTypesCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;

  machineTypes: GCPMachineSize[] = [];
  selectedMachineType = '';
  machineTypeLabel = MachineTypeState.Empty;
  zones: GCPZone[] = [];
  selectedZone = '';
  zoneLabel = ZoneState.Empty;
  diskTypes: GCPDiskType[] = [];
  selectedDiskType = '';
  diskTypeLabel = DiskTypeState.Empty;

  private get _zonesObservable(): Observable<GCPZone[]> {
    return this._nodeDataService.gcp
      .zones(this._clearZone.bind(this), this._onZoneLoading.bind(this))
      .pipe(map(zones => _.sortBy(zones, z => z.name.toLowerCase())));
  }

  private get _diskTypesObservable(): Observable<GCPDiskType[]> {
    return this._nodeDataService.gcp
      .diskTypes(this._clearDiskTypes.bind(this), this._onDiskTypeLoading.bind(this))
      .pipe(map(types => _.sortBy(types, t => t.name.toLowerCase())));
  }

  private get _machineTypesObservable(): Observable<GCPMachineSize[]> {
    return this._nodeDataService.gcp
      .machineTypes(this._clearMachineType.bind(this), this._onMachineTypeLoading.bind(this))
      .pipe(map(sizes => _.sortBy(sizes, s => s.name.toLowerCase())));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.DiskSize]: this._builder.control(this._defaultDiskSize, Validators.required),
      [Controls.DiskType]: this._builder.control('', Validators.required),
      [Controls.Zone]: this._builder.control('', Validators.required),
      [Controls.MachineType]: this._builder.control('', Validators.required),
      [Controls.Preemptible]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();
  }

  ngAfterViewInit(): void {
    this._zonesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultZone.bind(this));

    this._zoneChanges
      .pipe(tap(_ => this._clearDiskTypes()))
      .pipe(tap(_ => this._clearMachineType()))
      .pipe(filter(hasValue => hasValue))
      .pipe(switchMap(_ => this._diskTypesObservable))
      .pipe(tap(this._setDefaultDiskType.bind(this)))
      .pipe(switchMap(_ => this._machineTypesObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultMachineType.bind(this));

    merge(this.form.get(Controls.DiskSize).valueChanges, this.form.get(Controls.Preemptible).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onZoneChange(zone: string): void {
    this._nodeDataService.nodeData.spec.cloud.gcp.zone = zone;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    this._zoneChanges.emit(!!zone);
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.gcp.diskType = diskType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onMachineTypeChange(machineType: string): void {
    this._nodeDataService.nodeData.spec.cloud.gcp.machineType = machineType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  sizeDisplayName(machineName: string): string {
    const machine = this.machineTypes.find(size => size.name === machineName);
    if (!machine) {
      return machineName;
    }

    return `${machine.name} (${machine.description})`;
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.gcp) {
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.gcp.diskSize);
      this.form.get(Controls.Preemptible).setValue(this._nodeDataService.nodeData.spec.cloud.gcp.preemptible);
    }
  }

  private _clearZone(): void {
    this.zones = [];
    this.selectedZone = '';
    this.zoneLabel = ZoneState.Empty;
    this._zonesCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onZoneLoading(): void {
    this._clearZone();
    this.zoneLabel = ZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultZone(zones: GCPZone[]): void {
    this.zones = zones;
    this.selectedZone = this._nodeDataService.nodeData.spec.cloud.gcp.zone;

    if (!this.selectedZone && !_.isEmpty(this.zones)) {
      this.selectedZone = this.zones[0].name;
    }

    this.zoneLabel = this.selectedZone ? ZoneState.Ready : ZoneState.Empty;
    this._zoneChanges.emit(!!this.selectedZone);
    this._cdr.detectChanges();
  }

  private _clearDiskTypes(): void {
    this.diskTypes = [];
    this.selectedDiskType = '';
    this.diskTypeLabel = DiskTypeState.Empty;
    this._diskTypesCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onDiskTypeLoading(): void {
    this._clearDiskTypes();
    this.diskTypeLabel = DiskTypeState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultDiskType(diskTypes: GCPDiskType[]): void {
    this.diskTypes = diskTypes;
    this.selectedDiskType = this._nodeDataService.nodeData.spec.cloud.gcp.diskType;

    if (!this.selectedDiskType && !_.isEmpty(this.diskTypes)) {
      // If pd-standard is available select it by default, otherwise use the first disk type from available ones.
      this.selectedDiskType = this.diskTypes.find(dt => dt.name === 'pd-standard')
        ? 'pd-standard'
        : this.diskTypes[0].name;
    }

    this.diskTypeLabel = this.selectedDiskType ? DiskTypeState.Ready : DiskTypeState.Empty;
    this._cdr.detectChanges();
  }

  private _clearMachineType(): void {
    this.machineTypes = [];
    this.selectedMachineType = '';
    this.machineTypeLabel = MachineTypeState.Empty;
    this._machineTypesCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onMachineTypeLoading(): void {
    this._clearMachineType();
    this.machineTypeLabel = MachineTypeState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultMachineType(machineTypes: GCPMachineSize[]): void {
    this.machineTypes = machineTypes;
    this.selectedMachineType = this._nodeDataService.nodeData.spec.cloud.gcp.machineType;

    if (!this.selectedMachineType && !_.isEmpty(this.machineTypes)) {
      this.selectedMachineType = this._findCheapestInstance(machineTypes).name;
    }

    this.machineTypeLabel = this.selectedMachineType ? MachineTypeState.Ready : MachineTypeState.Empty;
    this._cdr.detectChanges();
  }

  private _findCheapestInstance(instanceTypes: GCPMachineSize[]): GCPMachineSize {
    // Avoid mutating original array
    return [...instanceTypes].sort((a, b) => compare(a.memory, b.memory)).sort((a, b) => compare(a.vcpus, b.vcpus))[0];
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          gcp: {
            diskSize: this.form.get(Controls.DiskSize).value,
            preemptible: !!this.form.get(Controls.Preemptible).value,
          } as GCPNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
