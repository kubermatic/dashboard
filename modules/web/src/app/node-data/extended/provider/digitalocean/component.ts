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
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  Backups = 'backups',
  Monitoring = 'monitoring',
  Tags = 'tags',
}

@Component({
  selector: 'km-digitalocean-extended-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DigitalOceanExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DigitalOceanExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class DigitalOceanExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: string[] = [];

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
      [Controls.Backups]: this._builder.control(false),
      [Controls.Monitoring]: this._builder.control(false),
      [Controls.Tags]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(this.form.get(Controls.Backups).valueChanges, this.form.get(Controls.Monitoring).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  onTagsChange(tags: string[]): void {
    this.tags = tags;
    this._nodeDataService.digitalOcean.tags = tags;
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          digitalocean: {
            backups: this.form.get(Controls.Backups).value,
            monitoring: this.form.get(Controls.Monitoring).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.digitalocean) {
      this.onTagsChange(this._nodeDataService.nodeData.spec.cloud.digitalocean.tags);

      this.form.get(Controls.Backups).setValue(this.nodeData.spec.cloud.digitalocean.backups);
      this.form.get(Controls.Monitoring).setValue(this.nodeData.spec.cloud.digitalocean.monitoring);
    }
  }
}
