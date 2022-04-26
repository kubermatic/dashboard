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
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {Subject} from 'rxjs';
import {VSphereTag} from '@shared/entity/node';

enum Controls {
  Tags = 'tags',
}

@Component({
  selector: 'km-sphere-extended-node-data',
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
  readonly _unsubscribe = new Subject<void>();

  tags: VSphereTag[] | any;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  ngOnInit(): void {
    this._init();
    this._initFormGroupControl();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onTagsChange(tagsData: object): void {
    const tags: VSphereTag[] = [];

    for (const [key, value] of Object.entries(tagsData)) {
      const newTag = new VSphereTag();
      newTag.name = key;
      newTag.description = value;
      tags.push(newTag);
    }
    this.tags = tags;
    this._nodeDataService.vsphere.tags = tags;
  }

  private _init(): void {
    const vSphereNodeCloudSpec = this.nodeData.spec.cloud.vsphere;

    if (vSphereNodeCloudSpec) {
      const tags = vSphereNodeCloudSpec.tags || [];
      this.onTagsChange(tags);
    }
  }

  private _initFormGroupControl() {
    this.form = this._builder.group({
      [Controls.Tags]: this._builder.control(''),
    });
  }
}
