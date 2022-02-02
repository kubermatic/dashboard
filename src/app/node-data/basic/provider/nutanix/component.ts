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

import {AfterViewInit, ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec, NutanixNodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

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
export class NutanixBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
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
  }

  ngAfterViewInit(): void {
    merge(
      this.form.get(Controls.ImageName).valueChanges,
      this.form.get(Controls.SubnetName).valueChanges,
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.CPUPassthrough).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
