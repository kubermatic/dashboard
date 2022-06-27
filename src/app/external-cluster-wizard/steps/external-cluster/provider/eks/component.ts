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

import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {forkJoin} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {StepBase} from '@app/external-cluster-wizard/base';

enum Controls {
  Name = 'name',
  Version = 'version',
  RoleArn = 'roleArn', // ClusterServiceRole
  Vpcs = 'vpcs',
  SubnetIds = 'subnetIds',
  SecurityGroupsIds = 'securityGroupIds',
}

@Component({
  selector: 'km-eks-external-cluster',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EKSExternalClusterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EKSExternalClusterComponent),
      multi: true,
    },
  ],
})
export class EKSExternalClusterComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;
  isLoading: boolean;
  vpcs: string[] = [];
  subnetIds: string[] = [];
  securityGroupIds: string[] = [];
  @Input() projectID: string;
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
    this._intiLookupValues();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  reset(): void {
    this.subnetIds = [];
    this.securityGroupIds = [];
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._nodeDataService.nodeData.name),
      [Controls.RoleArn]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control(''),
      [Controls.Vpcs]: this._builder.control('', Validators.required), // this will be used to show/hide subnets/security-groups dropdown
      [Controls.SubnetIds]: this._builder.control([], Validators.required),
      [Controls.SecurityGroupsIds]: this._builder.control([], Validators.required),
    });
  }

  private _intiLookupValues() {
    this.isLoading = true;
    this._externalClusterService
      .getEKSVpcs()
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((vpcs: any) => {
        this.vpcs = vpcs.map(vpc => vpc.id);
      });
  }

  private _initSubscriptions() {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
      const isFormValid = this.form.valid;
      if (isFormValid) {
        this._externalClusterService.isEKSExternalStepValid = isFormValid;
      }
    });

    // Note:
    // Fetch Subnets/Security Groups based on selected VPC
    this.form
      .get(Controls.Vpcs)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const vpc = this.form.get(Controls.Vpcs).value?.main;
        if (!vpc) {
          this.reset();
        } else {
          this._onVPCSelectionChange(vpc);
        }
      });
  }

  private _onVPCSelectionChange(vpc: string): void {
    forkJoin([
      this._externalClusterService.getEKSSubnetIds(vpc),
      this._externalClusterService.getEKSSecurityGroupIds(vpc),
    ]).subscribe((responses: [string[], string[]]) => {
      if (responses[0]) {
        this.subnetIds = responses[0];
      }
      if (responses[1]) {
        this.securityGroupIds = responses[1];
      }
    });
  }

  private _updateExternalClusterModel(): void {
    this._externalClusterService.externalCluster = {
      ...this._externalClusterService.externalCluster,
      name: this.controlValue(Controls.Name),
      cloud: {
        eks: {
          ...this._externalClusterService.externalCluster.cloud.eks,
          name: this.controlValue(Controls.Name),
        },
      },
      spec: {
        eksclusterSpec: {
          roleArn: this.controlValue(Controls.RoleArn),
          version: this.controlValue(Controls.Version),
          vpcConfigRequest: {
            subnetIds: this.controlValue(Controls.SubnetIds),
            securityGroupIds: this.controlValue(Controls.SecurityGroupsIds),
          },
        },
        version: this.controlValue(Controls.Version),
      },
    };
  }
}
