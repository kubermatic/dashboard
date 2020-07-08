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
import {takeUntil} from 'rxjs/operators';
import {AzureNodeSpec, NodeCloudSpec, NodeSpec} from '../../../../shared/entity/node';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  Tags = 'tags',
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
})
export class AzureExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: object;

  readonly Controls = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AssignPublicIP]: this._builder.control(true),
      [Controls.Tags]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this.form
      .get(Controls.AssignPublicIP)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  onTagsChange(tags: object): void {
    this._nodeDataService.azure.tags = tags;
  }

  private _init(): void {
    let assignPublicIP = false;
    if (this._nodeDataService.nodeData.spec.cloud.azure) {
      this.tags = this.nodeData.spec.cloud.azure.tags;

      assignPublicIP = this._nodeDataService.isInDialogEditMode()
        ? this.nodeData.spec.cloud.azure.assignPublicIP
        : true;
      this.form.get(Controls.AssignPublicIP).setValue(assignPublicIP);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          azure: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
          } as AzureNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
