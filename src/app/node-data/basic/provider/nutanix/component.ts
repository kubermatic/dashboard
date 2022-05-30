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
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {getDefaultNodeProviderSpec, NodeCloudSpec, NodeSpec, NutanixNodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {merge, Observable, of} from 'rxjs';
import {NodeProvider, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import _ from 'lodash';
import {NutanixSubnet} from '@shared/entity/provider/nutanix';

enum Controls {
  ImageName = 'imageName',
  SubnetName = 'subnetName',
  CPUs = 'cpus',
  CPUCores = 'cpuCores',
  CPUPassthrough = 'cpuPassthrough',
  MemoryMB = 'memoryMB',
  DiskSize = 'diskSize',
  Categories = 'categories',
}

enum SubnetState {
  Ready = 'Subnet',
  Loading = 'Loading...',
  Empty = 'No subnets available',
}

@Component({
  selector: 'km-nutanix-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutanixBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NutanixBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutanixBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewChecked, OnDestroy {
  readonly Controls = Controls;
  private _images: DatacenterOperatingSystemOptions;
  private _defaultImage = '';
  private _defaultOS: OperatingSystem;
  private _subnets: NutanixSubnet[] = [];
  selectedSubnet = '';
  subnetLabel = SubnetState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    const values = this._nodeDataService.nodeData.spec.cloud.nutanix;
    const defaults = getDefaultNodeProviderSpec(NodeProvider.NUTANIX) as NutanixNodeSpec;
    this.form = this._builder.group({
      [Controls.ImageName]: this._builder.control(values ? values.imageName : defaults.imageName, [
        Validators.required,
      ]),
      [Controls.SubnetName]: this._builder.control(values ? values.subnetName : defaults.subnetName, [
        Validators.required,
      ]),
      [Controls.CPUs]: this._builder.control(values ? values.cpus : defaults.cpus, [Validators.required]),
      [Controls.CPUCores]: this._builder.control(values ? values.cpuCores : defaults.cpuCores, [Validators.required]),
      [Controls.CPUPassthrough]: this._builder.control(values ? values.cpuPassthrough : defaults.cpuPassthrough),
      [Controls.MemoryMB]: this._builder.control(values ? values.memoryMB : defaults.memoryMB, [Validators.required]),
      [Controls.DiskSize]: this._builder.control(values ? values.diskSize : defaults.diskSize, [Validators.required]),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._subnetsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSubnet.bind(this));

    this._defaultOS = this._nodeDataService.operatingSystem;
    this._defaultImage = this._nodeDataService.nodeData.spec.cloud.nutanix.imageName;

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => (this._images = dc.spec?.nutanix?.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultImage(OperatingSystem.Ubuntu));

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));

    merge(
      this.form.get(Controls.ImageName).valueChanges,
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.CPUPassthrough).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnets(): NutanixSubnet[] {
    return this._subnets;
  }

  subnetsDisplayName(subnetName: string): string {
    const subnet = this._subnets.find(size => size.name === subnetName);
    if (!subnet) {
      return subnetName;
    }

    return `${subnet.name} (${subnet.type})`;
  }

  onSubnetChange(subnet: string): void {
    this._nodeDataService.nodeData.spec.cloud.nutanix.subnetName = subnet;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  private get _subnetsObservable(): Observable<NutanixSubnet[]> {
    return this._nodeDataService.nutanix.subnets(this._clearSubnet.bind(this), this._onSubnetLoading.bind(this));
  }

  private _onSubnetLoading(): void {
    this._clearSubnet();
    this.subnetLabel = SubnetState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSubnet(): void {
    this.selectedSubnet = '';
    this._subnets = [];
    this.subnetLabel = SubnetState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSubnet(subnets: NutanixSubnet[]): void {
    this._subnets = subnets;
    this.selectedSubnet = this._nodeDataService.nodeData.spec.cloud.nutanix
      ? this._nodeDataService.nodeData.spec.cloud.nutanix.subnetName
      : '';

    if (!this.selectedSubnet && this._subnets && !_.isEmpty(this._subnets)) {
      this.selectedSubnet = this._subnets[0].name;
    }

    this.subnetLabel = this.selectedSubnet ? SubnetState.Ready : SubnetState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultImage(os: OperatingSystem): void {
    let defaultImage = this._getDefaultImage(os);

    if (_.isEmpty(this._defaultImage)) {
      this._defaultImage = defaultImage;
    }

    if (os === this._defaultOS) {
      defaultImage = this._defaultImage;
    }

    this.form.get(Controls.ImageName).setValue(defaultImage);
    this._cdr.detectChanges();
  }

  private _getDefaultImage(os: OperatingSystem): string {
    switch (os) {
      case OperatingSystem.CentOS:
        return this._images?.centos;
      case OperatingSystem.Ubuntu:
        return this._images?.ubuntu;
      case OperatingSystem.SLES:
        return this._images?.sles;
      case OperatingSystem.RHEL:
        return this._images?.rhel;
      case OperatingSystem.Flatcar:
        return this._images?.flatcar;
      case OperatingSystem.RockyLinux:
        return this._images?.rockylinux;
      default:
        return this._images?.ubuntu;
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          nutanix: {
            imageName: this.form.get(Controls.ImageName).value,
            cpus: this.form.get(Controls.CPUs).value,
            cpuCores: this.form.get(Controls.CPUCores).value,
            cpuPassthrough: !!this.form.get(Controls.CPUPassthrough).value,
            memoryMB: this.form.get(Controls.MemoryMB).value,
            diskSize: this.form.get(Controls.DiskSize).value,
          } as NutanixNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
