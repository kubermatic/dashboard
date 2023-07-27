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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {pushDown} from '@shared/animations/push';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {KmValidators} from '@shared/validators/validators';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  IsSpotInstance = 'isSpotInstance',
  SpotInstanceMaxPrice = 'spotInstanceMaxPrice',
  SpotInstancePersistentRequest = 'spotInstancePersistentRequest',
  Tags = 'tags',
  EBSVolumeEncrypted = 'ebsVolumeEncrypted',
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
  animations: [pushDown],
})
export class AWSExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: object;

  readonly Controls = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  get isSpotInstance(): boolean {
    return this.form.get(Controls.IsSpotInstance).value;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AssignPublicIP]: this._builder.control(false),
      [Controls.IsSpotInstance]: this._builder.control(false),
      [Controls.Tags]: this._builder.control(''),
      [Controls.SpotInstanceMaxPrice]: this._builder.control('', [KmValidators.largerThan(0)]),
      [Controls.SpotInstancePersistentRequest]: this._builder.control(false),
      [Controls.EBSVolumeEncrypted]: this._builder.control(false),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.AssignPublicIP).valueChanges,
      this.form.get(Controls.IsSpotInstance).valueChanges,
      this.form.get(Controls.SpotInstanceMaxPrice).valueChanges,
      this.form.get(Controls.SpotInstancePersistentRequest).valueChanges,
      this.form.get(Controls.EBSVolumeEncrypted).valueChanges,
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this.form
      .get(Controls.IsSpotInstance)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(checked => {
        checked
          ? this.form
              .get(Controls.SpotInstanceMaxPrice)
              .setValidators([KmValidators.largerThan(0), Validators.required])
          : this.form.get(Controls.SpotInstanceMaxPrice).setValidators(KmValidators.largerThan(0));
        this.form.get(Controls.SpotInstanceMaxPrice).setValue(undefined);
        this.form.get(Controls.SpotInstanceMaxPrice).updateValueAndValidity();
      });
  }

  onTagsChange(tags: object): void {
    this.tags = tags;
    this._nodeDataService.aws.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this.nodeData.spec.cloud.aws) {
      this.onTagsChange(this.nodeData.spec.cloud.aws.tags);

      if (this.nodeData.name) {
        const assignPublicIP = this.nodeData.spec.cloud.aws.assignPublicIP ?? false;
        this.form.get(Controls.AssignPublicIP).setValue(assignPublicIP);

        const isSpotInstance = this.nodeData.spec.cloud.aws.isSpotInstance ?? false;
        this.form.get(Controls.IsSpotInstance).setValue(isSpotInstance);

        const spotInstanceMaxPrice = this.nodeData.spec.cloud.aws.spotInstanceMaxPrice ?? '';
        this.form.get(Controls.SpotInstanceMaxPrice).setValue(spotInstanceMaxPrice);

        const spotInstancePersistentRequest = this.nodeData.spec.cloud.aws.spotInstancePersistentRequest ?? false;
        this.form.get(Controls.SpotInstancePersistentRequest).setValue(spotInstancePersistentRequest);

        const ebsVolumeEncrypted = this.nodeData.spec.cloud.aws.ebsVolumeEncrypted ?? false;
        this.form.get(Controls.EBSVolumeEncrypted).setValue(ebsVolumeEncrypted);
      }
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
            isSpotInstance: this.form.get(Controls.IsSpotInstance).value,
            spotInstanceMaxPrice: `${this.form.get(Controls.SpotInstanceMaxPrice).value}`,
            spotInstancePersistentRequest: this.form.get(Controls.SpotInstancePersistentRequest).value,
            ebsVolumeEncrypted: this.form.get(Controls.EBSVolumeEncrypted).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
