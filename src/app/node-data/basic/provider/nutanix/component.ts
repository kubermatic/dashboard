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
import {NodeCloudSpec, NodeSpec, NutanixNodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {merge, of} from 'rxjs';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import _ from 'lodash';

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
  private _images: DatacenterOperatingSystemOptions;
  private _defaultImage = '';
  private _defaultOS: OperatingSystem;
  readonly Controls = Controls;

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
    this.form = this._builder.group({
      [Controls.ImageName]: this._builder.control(values ? values.imageName : '', [Validators.required]),
      [Controls.SubnetName]: this._builder.control(values ? values.subnetName : '', [Validators.required]),
      [Controls.CPUs]: this._builder.control(values ? values.cpus : 2, [Validators.required]),
      [Controls.CPUCores]: this._builder.control(values ? values.cpuCores : 1, [Validators.required]),
      [Controls.CPUPassthrough]: this._builder.control(values ? values.cpuPassthrough : false),
      [Controls.MemoryMB]: this._builder.control(values ? values.memoryMB : 2048, [Validators.required]),
      [Controls.DiskSize]: this._builder.control(values ? values.diskSize : 20, [Validators.required]),
    });

    this._nodeDataService.nodeData = this._getNodeData();
    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this._defaultOS = this._nodeDataService.operatingSystem;
    this._defaultImage = this._nodeDataService.nodeData.spec.cloud.nutanix.imageName;

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => console.log(dc)))
      .pipe(tap(dc => (this._images = dc.spec?.nutanix?.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultImage(OperatingSystem.Ubuntu));

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));
  }

  ngAfterViewChecked(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
            subnetName: this.form.get(Controls.SubnetName).value,
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
