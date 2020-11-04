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

import {AfterViewChecked, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@app/node-data/service/service';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  VlanID = 'vlanID',
  TemplateID = 'templateID',
  Cpus = 'cpus',
  Memory = 'memory',
  DiskSize = 'diskSize',
}

@Component({
  selector: 'km-anexia-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AnexiaBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AnexiaBasicNodeDataComponent),
      multi: true,
    },
  ],
})
export class AnexiaBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewChecked {
  readonly Controls = Controls;
  private readonly _defaultDiskSize = 20; // in GiB
  private readonly _defaultCpus = 1;
  private readonly _defaultMemory = 2048; // in MB

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VlanID]: this._builder.control('', Validators.required),
      [Controls.TemplateID]: this._builder.control('', Validators.required),
      [Controls.Cpus]: this._builder.control(this._defaultCpus, Validators.required),
      [Controls.Memory]: this._builder.control(this._defaultMemory, Validators.required),
      [Controls.DiskSize]: this._builder.control(this._defaultDiskSize, Validators.required),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.VlanID).valueChanges,
      this.form.get(Controls.TemplateID).valueChanges,
      this.form.get(Controls.Cpus).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.anexia) {
      this.form.get(Controls.VlanID).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.vlanID);
      this.form.get(Controls.TemplateID).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.templateID);
      this.form.get(Controls.Cpus).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.cpus);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.memory);
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.diskSize);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          anexia: {
            vlanID: this.form.get(Controls.VlanID).value,
            templateID: this.form.get(Controls.TemplateID).value,
            cpus: this.form.get(Controls.Cpus).value,
            memory: this.form.get(Controls.Memory).value,
            diskSize: this.form.get(Controls.DiskSize).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
