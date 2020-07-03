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
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {Datacenter} from '../../../shared/entity/datacenter';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-azure-node-options',
  templateUrl: './azure-node-options.component.html',
})
export class AzureNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  form: FormGroup;
  datacenter: Datacenter;
  hideOptional = true;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      assignPublicIP: new FormControl(this.nodeData.spec.cloud.azure.assignPublicIP),
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        azure: {
          size: this.nodeData.spec.cloud.azure.size,
          zone: this.nodeData.spec.cloud.azure.zone,
          assignPublicIP: this.form.controls.assignPublicIP.value,
          tags: this.nodeData.spec.cloud.azure.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
