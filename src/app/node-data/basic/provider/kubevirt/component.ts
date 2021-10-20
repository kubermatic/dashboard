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

import {AfterViewChecked, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  CPUs = 'cpus',
  Memory = 'memory',
  Namespace = 'namespace',
  SourceURL = 'sourceURL',
  StorageClassName = 'storageClassName',
  PVCSize = 'pvcSize',
}

@Component({
  selector: 'km-kubevirt-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
  ],
})
export class KubeVirtBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewChecked {
  private readonly _sizeSuffixPattern = /^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control('1', Validators.required),
      [Controls.Memory]: this._builder.control('2Gi', [
        Validators.required,
        Validators.pattern(this._sizeSuffixPattern),
      ]),
      [Controls.Namespace]: this._builder.control('', Validators.required),
      [Controls.SourceURL]: this._builder.control('', Validators.required),
      [Controls.StorageClassName]: this._builder.control('', Validators.required),
      [Controls.PVCSize]: this._builder.control('10Gi', [
        Validators.required,
        Validators.pattern(this._sizeSuffixPattern),
      ]),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.Namespace).valueChanges,
      this.form.get(Controls.SourceURL).valueChanges,
      this.form.get(Controls.StorageClassName).valueChanges,
      this.form.get(Controls.PVCSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.kubevirt) {
      this.form.get(Controls.Namespace).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.namespace);
      this.form.get(Controls.PVCSize).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.pvcSize);
      this.form
        .get(Controls.StorageClassName)
        .setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.storageClassName);
      this.form.get(Controls.SourceURL).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.sourceURL);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.memory);
      this.form.get(Controls.CPUs).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.cpus);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          kubevirt: {
            cpus: `${this.form.get(Controls.CPUs).value}`,
            memory: this.form.get(Controls.Memory).value,
            namespace: this.form.get(Controls.Namespace).value,
            sourceURL: this.form.get(Controls.SourceURL).value,
            storageClassName: this.form.get(Controls.StorageClassName).value,
            pvcSize: this.form.get(Controls.PVCSize).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
