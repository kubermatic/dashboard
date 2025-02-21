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
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  Tags = 'tags',
  Labels = 'labels',
}

@Component({
  selector: 'km-gcp-extended-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GCPExtendedNodeDataComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class GCPExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  labels: object;
  tags: string[] = [];

  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Labels]: this._builder.control(''),
      [Controls.Tags]: this._builder.control(''),
    });

    this._init();
  }

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._nodeDataService.gcp.labels = labels;
  }

  onTagsChange(tags: string[]): void {
    this.tags = tags || [];
    this._nodeDataService.gcp.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.gcp) {
      this.onTagsChange(this._nodeDataService.nodeData.spec.cloud.gcp.tags);
      this.onLabelsChange(this._nodeDataService.nodeData.spec.cloud.gcp.labels);
    }
  }
}
