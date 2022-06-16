// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';

enum Controls {
  Name = 'name',
  Version = 'version',
  RoleArn = 'roleArn', // ClusterServiceRole
  SubnetIds = 'subnetIds',
  SecurityGroupsIds = 'securityGroupIds',
}

@Component({
  selector: 'km-eks-external-cluster',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EKSExternalClusterComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  dialogEditMode = false;
  subnetIds: string[] = [];
  securityGroupIds: string[] = [];
  @Input() showExtended = false; // Used only when in dialog mode.

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  isDialogView(): boolean {
    // In the wizard we do not split extended and basic options.
    return !this._nodeDataService.isInWizardMode();
  }

  onSubnetIdsChange(subnetIds: string[]): void {
    this.subnetIds = subnetIds;
    this.form.get(Controls.SubnetIds).updateValueAndValidity();
  }

  onSecurityGroupIdsChange(securityGroupIds: string[]): void {
    this.securityGroupIds = securityGroupIds;
    this.form.get(Controls.SecurityGroupsIds).updateValueAndValidity();
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._nodeDataService.nodeData.name, [
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.RoleArn]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control(''),
      [Controls.SubnetIds]: this._builder.control('', Validators.required),
      [Controls.SecurityGroupsIds]: this._builder.control('', Validators.required),
    });
  }

  private _initSubscriptions() {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
    });
  }

  private _updateExternalClusterModel(): void {
    this._externalClusterService.externalCluster = {
      ...this._externalClusterService.externalCluster,
      name: this.form.get(Controls.Name).value,
      cloud: {
        eks: {
          ...this._externalClusterService.externalCluster.cloud.eks,
          name: this.form.get(Controls.Name).value,
        },
      },
      spec: {
        eksclusterSpec: {
          roleArn: this.form.get(Controls.RoleArn).value,
          version: this.form.get(Controls.Version).value,
          vpcConfigRequest: {
            subnetIds: this.subnetIds,
            securityGroupIds: this.securityGroupIds,
          },
        },
        version: this.form.get(Controls.Version).value,
      },
    };
  }
}
