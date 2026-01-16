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
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {DynamicModule} from '@app/dynamic/module-registry';
import _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {GCPNodeSpec, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {GCPDiskType, GCPMachineSize, GCPZone} from '@shared/entity/provider/gcp';
import {NodeData} from '@shared/model/NodeSpecChange';
import {compare} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';

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
  styleUrls: ['./style.scss'],
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
  standalone: false,
})
export class GCPBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewInit, OnDestroy {
  private readonly _defaultDiskSize = 25;
  private _zoneChanges = new EventEmitter<boolean>();
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  @ViewChild('zonesCombobox')
  private _zonesCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;

  machineTypes: GCPMachineSize[] = [];
  selectedMachineType = '';
  machineTypeLabel = MachineTypeState.Empty;
  isLoadingMachineTypes = false;
  zones: GCPZone[] = [];
  selectedZone = '';
  zoneLabel = ZoneState.Empty;
  diskTypes: GCPDiskType[] = [];
  selectedDiskType = '';
  diskTypeLabel = DiskTypeState.Empty;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  private _quotaCalculationService: QuotaCalculationService;

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

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
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

    this.form
      .get(Controls.MachineType)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(machineType => {
        if (machineType) {
          this.onMachineTypeChange(machineType);
        }
      });

    this.form
      .get(Controls.MachineType)
      .valueChanges.pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(machineType => {
        if (machineType) {
          const payload = this._getQuotaCalculationPayload();
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onZoneChange(zone: string): void {
    if (zone !== this._nodeDataService.nodeData.spec.cloud.gcp.zone) {
      this._nodeDataService.nodeData.spec.cloud.gcp.zone = zone;
      this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
      this._zoneChanges.emit(!!zone);
    }
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.gcp.diskType = diskType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onMachineTypeChange(machineType: string): void {
    this._nodeDataService.nodeData.spec.cloud.gcp.machineType = machineType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  isDialogView(): boolean {
    // In the wizard we do not split extended and basic options.
    return !this._nodeDataService.isInWizardMode();
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
    this.zoneLabel = ZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultZone(zones: GCPZone[]): void {
    this.zones = zones;
    this.selectedZone = this._nodeDataService.nodeData.spec.cloud.gcp.zone;

    if (!this.selectedZone && !_.isEmpty(this.zones)) {
      this.selectedZone = this.zones[0].name;
    }
    this._zoneChanges.emit(!!this.selectedZone);

    this.zoneLabel = this.selectedZone ? ZoneState.Ready : ZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _clearDiskTypes(): void {
    this.diskTypes = [];
    this.selectedDiskType = '';
    this.diskTypeLabel = DiskTypeState.Empty;
    this._cdr.detectChanges();
  }

  private _onDiskTypeLoading(): void {
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
    this.isLoadingMachineTypes = false;
    this._cdr.detectChanges();
  }

  private _onMachineTypeLoading(): void {
    this.machineTypeLabel = MachineTypeState.Loading;
    this.isLoadingMachineTypes = true;
    this._cdr.detectChanges();
  }

  private _setDefaultMachineType(machineTypes: GCPMachineSize[]): void {
    this.machineTypes = machineTypes;
    this.selectedMachineType = this._nodeDataService.nodeData.spec.cloud.gcp.machineType;

    if (!this.selectedMachineType && !_.isEmpty(this.machineTypes)) {
      this.selectedMachineType = this._findCheapestInstance(machineTypes).name;
      this.onMachineTypeChange(this.selectedMachineType);
    }

    this.machineTypeLabel = this.selectedMachineType ? MachineTypeState.Ready : MachineTypeState.Empty;
    this.isLoadingMachineTypes = false;
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

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    const size = this._nodeDataService.nodeData.spec.cloud.gcp.machineType;
    const selectedMachineType = this.machineTypes.find(s => s.name === size);

    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      diskSizeGB: this.form.get(Controls.DiskSize).value,
      gcpSize: {
        ...selectedMachineType,
      } as GCPMachineSize,
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
