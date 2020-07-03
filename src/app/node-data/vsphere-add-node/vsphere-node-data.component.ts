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
  selector: 'km-vsphere-node-data',
  templateUrl: './vsphere-node-data.component.html',
})
export class VSphereNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;

  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private _nodeDataService: NodeDataService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      cpu: new FormControl(this.nodeData.spec.cloud.vsphere.cpus, [Validators.required, Validators.min(1)]),
      memory: new FormControl(this.nodeData.spec.cloud.vsphere.memory, [Validators.required, Validators.min(512)]),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
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
        vsphere: {
          cpus: this.form.controls.cpu.value,
          memory: this.form.controls.memory.value,
          template: this.nodeData.spec.cloud.vsphere.template,
          diskSizeGB: this.nodeData.spec.cloud.vsphere.diskSizeGB,
        },
      },
      valid: this.form.valid,
    };
  }
}
