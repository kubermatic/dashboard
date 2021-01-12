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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec, VSphereNodeSpec} from '../../../../shared/entity/node';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataMode} from '../../../config';
import {NodeDataService} from '../../../service/service';

enum Controls {
  DiskSizeGB = 'diskSizeGB',
}

@Component({
  selector: 'km-vsphere-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class VSphereExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _defaultDiskSize = 10;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.DiskSizeGB]: this._builder.control(this._defaultDiskSize),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(this.form.get(Controls.DiskSizeGB).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.vsphere) {
      const diskSizeGB =
        this._nodeDataService.mode === NodeDataMode.Dialog && !!this._nodeDataService.nodeData.name
          ? this._nodeDataService.nodeData.spec.cloud.vsphere.diskSizeGB
          : this.form.get(Controls.DiskSizeGB).value;
      this.form.get(Controls.DiskSizeGB).setValue(diskSizeGB);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vsphere: {
            diskSizeGB: this.form.get(Controls.DiskSizeGB).value,
          } as VSphereNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
