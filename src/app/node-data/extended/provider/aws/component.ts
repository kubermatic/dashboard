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
import {NodeDataService} from '@core/services/node-data/service';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {NodeDataMode} from '../../../config';
import {merge} from 'rxjs';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  IsSpotInstance = 'isSpotInstance',
  Tags = 'tags',
}

@Component({
  selector: 'km-aws-extended-node-data',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class AWSExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
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
      [Controls.IsSpotInstance]: this._builder.control(false),
      [Controls.Tags]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(this.form.get(Controls.AssignPublicIP).valueChanges, this.form.get(Controls.IsSpotInstance).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  onTagsChange(tags: object): void {
    this.tags = tags;
    this._nodeDataService.aws.tags = tags;
  }

  private _init(): void {
    if (this.nodeData.spec.cloud.aws) {
      this.onTagsChange(this.nodeData.spec.cloud.aws.tags);

      const assignPublicIP =
        this._nodeDataService.mode === NodeDataMode.Dialog && !!this.nodeData.name
          ? this.nodeData.spec.cloud.aws.assignPublicIP
          : true;
      this.form.get(Controls.AssignPublicIP).setValue(assignPublicIP);

      const isSpotInstance =
        this._nodeDataService.mode === NodeDataMode.Dialog && !!this.nodeData.name
          ? this.nodeData.spec.cloud.aws.isSpotInstance
          : false;
      this.form.get(Controls.IsSpotInstance).setValue(isSpotInstance);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
            isSpotInstance: this.form.get(Controls.IsSpotInstance).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
