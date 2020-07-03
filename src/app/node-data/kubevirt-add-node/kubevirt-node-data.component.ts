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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/cluster';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-kubevirt-node-data',
  templateUrl: './kubevirt-node-data.component.html',
})
export class KubeVirtNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;
  formGroup: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cpus: new FormControl(this.nodeData.spec.cloud.kubevirt.cpus || '1', [
        Validators.required,
        Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
      ]),
      memory: new FormControl(this.nodeData.spec.cloud.kubevirt.memory || '2Gi', [
        Validators.required,
        Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
      ]),
      namespace: new FormControl(this.nodeData.spec.cloud.kubevirt.namespace, [Validators.required]),
      sourceURL: new FormControl(this.nodeData.spec.cloud.kubevirt.sourceURL, [Validators.required]),
      storageClassName: new FormControl(this.nodeData.spec.cloud.kubevirt.storageClassName, [Validators.required]),
      pvcSize: new FormControl(this.nodeData.spec.cloud.kubevirt.pvcSize || '10Gi', [
        Validators.required,
        Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
      ]),
    });

    this.formGroup.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        kubevirt: {
          cpus: this.formGroup.controls.cpus.value,
          memory: this.formGroup.controls.memory.value,
          namespace: this.formGroup.controls.namespace.value,
          sourceURL: this.formGroup.controls.sourceURL.value,
          storageClassName: this.formGroup.controls.storageClassName.value,
          pvcSize: this.formGroup.controls.pvcSize.value,
        },
      },
      valid: this.formGroup.valid,
    };
  }
}
