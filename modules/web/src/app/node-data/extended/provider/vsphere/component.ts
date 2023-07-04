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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {NodeCloudSpec, NodeSpec, VSphereNodeSpec, VSphereTag} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Tags = 'tags',
  VMAntiAffinity = 'vmAntiAffinity',
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
  readonly controls = Controls;

  tags: VSphereTag[];

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Tags]: this._builder.control(''),
      [Controls.VMAntiAffinity]: this._builder.control(false),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this.form
      .get(Controls.VMAntiAffinity)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData = this._getNodeData();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onTagsChange(tags: VSphereTag[]): void {
    this.tags = tags;
    this._nodeDataService.vsphere.tags = tags;
  }

  private _init(): void {
    const vSphereNodeCloudSpec = this.nodeData.spec.cloud.vsphere;

    if (vSphereNodeCloudSpec) {
      this.tags = vSphereNodeCloudSpec.tags;

      if (this.nodeData.name) {
        const vmAntiAffinity = this.nodeData.spec.cloud.vsphere.vmAntiAffinity ?? false;
        this.form.get(Controls.VMAntiAffinity).setValue(vmAntiAffinity);
      }
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vsphere: {
            vmAntiAffinity: this.form.get(Controls.VMAntiAffinity).value,
          } as VSphereNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
