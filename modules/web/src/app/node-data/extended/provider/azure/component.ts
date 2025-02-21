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
import {takeUntil} from 'rxjs/operators';
import {AzureNodeSpec, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  Tags = 'tags',
  AcceleratedNetworking = 'acceleratedNetworking',
}

@Component({
    selector: 'km-azure-extended-node-data',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AzureExtendedNodeDataComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AzureExtendedNodeDataComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class AzureExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: object;

  readonly Controls = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AssignPublicIP]: this._builder.control(false),
      [Controls.Tags]: this._builder.control(''),
      [Controls.AcceleratedNetworking]: this._builder.control(false),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.AssignPublicIP).valueChanges,
      this.form.get(Controls.AcceleratedNetworking).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.azure.acceleratedNetworking.next(this.form.get(Controls.AcceleratedNetworking).value);
        this._nodeDataService.nodeData = this._getNodeData();
      });
  }

  onTagsChange(tags: object): void {
    this.tags = tags;
    this._nodeDataService.azure.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.azure) {
      this.onTagsChange(this.nodeData.spec.cloud.azure.tags);

      const assignPublicIP = this.nodeData.name ? this.nodeData.spec.cloud.azure.assignPublicIP : false;
      this.form.get(Controls.AssignPublicIP).setValue(assignPublicIP);

      const acceleratedNetworking = this.nodeData.name
        ? this.nodeData.spec.cloud.azure.enableAcceleratedNetworking
        : false;
      this.form.get(Controls.AcceleratedNetworking).setValue(acceleratedNetworking);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          azure: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
            enableAcceleratedNetworking: this.form.get(Controls.AcceleratedNetworking).value,
          } as AzureNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
