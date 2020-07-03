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
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-aws-node-options',
  templateUrl: './aws-node-options.component.html',
})
export class AWSNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  form: FormGroup;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    const isInEdit = !!this.nodeData.name; // Existing machine deployment will always have assigned name.
    const assignPublicIP = isInEdit ? this.nodeData.spec.cloud.aws.assignPublicIP : true; // Default to true.

    this.form = new FormGroup({
      assignPublicIP: new FormControl(assignPublicIP),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
    });

    this._addNodeService.nodeProviderDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.nodeData.spec.cloud.aws = data.spec.aws;
      this.nodeData.valid = data.valid;
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        aws: {
          instanceType: this.nodeData.spec.cloud.aws.instanceType,
          diskSize: this.nodeData.spec.cloud.aws.diskSize,
          ami: this.nodeData.spec.cloud.aws.ami,
          volumeType: this.nodeData.spec.cloud.aws.volumeType,
          subnetID: this.nodeData.spec.cloud.aws.subnetID,
          availabilityZone: this.nodeData.spec.cloud.aws.availabilityZone,
          assignPublicIP: this.form.controls.assignPublicIP.value,
          tags: this.nodeData.spec.cloud.aws.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
