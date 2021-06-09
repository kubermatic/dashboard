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
import {NodeDataService} from '@core/services/node-data/service';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {AWSSize, AWSSubnet} from '@shared/entity/provider/aws';
import {NodeData} from '@shared/model/NodeSpecChange';
import {compare} from '@shared/utils/common-utils';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Size = 'size',
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  SubnetID = 'subnetId',
  AMI = 'ami',
}

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading...',
  Empty = 'No Node Sizes Available',
}

enum SubnetState {
  Ready = 'Subnet ID & Availability Zone',
  Loading = 'Loading...',
  Empty = 'No Subnet IDs & Availability Zones Available',
}

@Component({
  selector: 'km-aws-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AWSBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewChecked, OnDestroy {
  readonly Controls = Controls;
  sizes: AWSSize[] = [];
  selectedSize = '';
  sizeLabel = SizeState.Empty;
  selectedSubnet = '';
  subnetLabel = SubnetState.Empty;
  selectedDiskType = '';
  private readonly _defaultDiskSize = 25;
  private _diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  diskTypes = this._diskTypes.map(type => ({name: type}));
  private _subnets: AWSSubnet[] = [];
  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  @ViewChild('sizeCombobox')
  private readonly _sizeCombobox: FilteredComboboxComponent;
  @ViewChild('subnetCombobox')
  private readonly _subnetCombobox: FilteredComboboxComponent;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  private get _sizesObservable(): Observable<AWSSize[]> {
    return this._nodeDataService.aws
      .flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this))
      .pipe(map(sizes => _.sortBy(sizes, s => s.name.toLowerCase())));
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return this._nodeDataService.aws.subnets(this._clearSubnet.bind(this), this._onSubnetLoading.bind(this));
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(this._defaultDiskSize, Validators.required),
      [Controls.DiskType]: this._builder.control('', Validators.required),
      [Controls.SubnetID]: this._builder.control(''),
      [Controls.AMI]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
    this._subnetIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSubnet.bind(this));

    this._presets.presetChanges
      .pipe(tap(_ => this._clearSubnet()))
      .pipe(switchMap(_ => this._subnetIdsObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultSubnet.bind(this));

    merge(this.form.get(Controls.AMI).valueChanges, this.form.get(Controls.DiskSize).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // If disk types will be loaded from the backend, this can be moved to ngOnInit
    this._setDefaultDiskType();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this._subnetMap[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== '' ? subnet.name + ' (' + subnet.id + ')' : subnet.id;
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.instanceType = size;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onSubnetChange(subnet: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.subnetID = subnet;
    this._nodeDataService.nodeData.spec.cloud.aws.availabilityZone = this._getAZFromSubnet(subnet);
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.volumeType = diskType;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  sizeDisplayName(sizeName: string): string {
    const size = this.sizes.find(size => size.name === sizeName);
    if (!size) {
      return sizeName;
    }

    let result = `${size.pretty_name} (${size.vcpus} vCPU`;
    if (size.gpus) {
      result = `${result}, ${size.gpus} GPU`;
    }

    return `${result}, ${size.memory} GB RAM, ${size.price} USD per hour)`;
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.aws) {
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.aws.diskSize);

      this._cdr.detectChanges();
    }
  }

  private _setDefaultDiskType(): void {
    this.selectedDiskType = this._nodeDataService.nodeData.spec.cloud.aws.volumeType;

    if (!this.selectedDiskType) {
      this.selectedDiskType = this._diskTypes[0];
    }

    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes.sort((a, b) => compare(a.price, b.price));
    this.selectedSize = this._nodeDataService.nodeData.spec.cloud.aws.instanceType;

    if (!this.selectedSize && this.sizes.length > 0) {
      const cheapestInstance = this.sizes.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
      this.selectedSize = cheapestInstance.name;
    }

    this.sizeLabel = this.selectedSize ? SizeState.Ready : SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    if (subnets.length === 0) {
      return;
    }

    this._subnets = subnets;
    this._subnetMap = {};
    this.selectedSubnet = this._nodeDataService.nodeData.spec.cloud.aws.subnetID;

    if (!this.selectedSubnet && this._subnets.length > 0) {
      const defaultSubnet = this._subnets.find(s => s.isDefaultSubnet);
      this.selectedSubnet = defaultSubnet ? defaultSubnet.id : this._subnets[0].id;
    }

    this.subnetLabel = this._subnets.length ? SubnetState.Ready : SubnetState.Empty;
    this._initSubnetMap();
    this.onSubnetChange(this.selectedSubnet);
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.sizes = [];
    this.selectedSize = '';
    this.sizeLabel = SizeState.Empty;
    this._sizeCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearSubnet(): void {
    this._subnets = [];
    this._subnetMap = {};
    this.subnetLabel = SubnetState.Empty;
    this.selectedSubnet = '';
    this._subnetCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _onSubnetLoading(): void {
    this._clearSubnet();
    this.subnetLabel = SubnetState.Loading;
    this._cdr.detectChanges();
  }

  private _initSubnetMap(): void {
    this._subnets = _.sortBy(this._subnets, s => s.name.toLowerCase());
    this._subnets.forEach(subnet => {
      const found = this.subnetAZ.find(s => s === subnet.availability_zone);
      if (!found) {
        this._subnetMap[subnet.availability_zone] = [];
      }

      this._subnetMap[subnet.availability_zone].push(subnet);
    });
  }

  private _getAZFromSubnet(subnetID: string): string {
    const findSubnet = this._subnets.find(x => x.id === subnetID);
    return findSubnet ? findSubnet.availability_zone : '';
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            diskSize: this.form.get(Controls.DiskSize).value,
            ami: this.form.get(Controls.AMI).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
