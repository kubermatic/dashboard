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
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NameGeneratorService} from '@core/services/name-generator';
import {EKSVpc} from '@shared/entity/provider/eks';
import {forkJoin} from 'rxjs';
import {debounceTime, finalize, takeUntil} from 'rxjs/operators';

enum Controls {
  Name = 'name',
  Version = 'version',
  RoleArn = 'roleArn',
  Vpc = 'vpc',
  SubnetIds = 'subnetIds',
  SecurityGroupsIds = 'securityGroupIds',
}

@Component({
  selector: 'km-eks-cluster-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EKSClusterSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EKSClusterSettingsComponent),
      multi: true,
    },
  ],
})
export class EKSClusterSettingsComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isLoadingVpcs: boolean;
  vpcs: string[] = [];
  subnetIds: string[] = [];
  securityGroupIds: string[] = [];
  @Input() projectID: string;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _nameGenerator: NameGeneratorService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this.reset();
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.RoleArn]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control(null),
      [Controls.Vpc]: this._builder.control(null, Validators.required),
      [Controls.SubnetIds]: this._builder.control([], Validators.required),
      [Controls.SecurityGroupsIds]: this._builder.control([], Validators.required),
    });
  }

  private _initSubscriptions() {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
    });

    this.form
      .get(Controls.Vpc)
      .valueChanges.pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const vpc = this.controlValue(Controls.Vpc)?.main;
        if (vpc) {
          this._onVPCSelectionChange(vpc);
        }
        this.control(Controls.SubnetIds).setValue([]);
        this.control(Controls.SecurityGroupsIds).setValue([]);
      });

    this._externalClusterService.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      if (!preset) {
        return;
      }
      this._getEKSVpcs();
    });

    this._externalClusterService
      .getProviderCredentialChangesObservable()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(isValid => {
        if (!isValid) {
          return;
        }
        this._getEKSVpcs();
      });
  }

  private _getEKSVpcs() {
    this.isLoadingVpcs = true;
    this._externalClusterService
      .getEKSVpcs()
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingVpcs = false))
      )
      .subscribe((vpcs: EKSVpc[]) => {
        this.vpcs = vpcs.map(vpc => vpc.id);
      });
  }

  private _onVPCSelectionChange(vpc: string): void {
    forkJoin([
      this._externalClusterService.getEKSSubnets(vpc),
      this._externalClusterService.getEKSSecurityGroups(vpc),
    ]).subscribe(([subnetIds, securityGroupIds]) => {
      this.subnetIds = subnetIds;
      this.securityGroupIds = securityGroupIds;
    });
  }

  private _updateExternalClusterModel(): void {
    this._externalClusterService.externalCluster = {
      ...this._externalClusterService.externalCluster,
      name: this.controlValue(Controls.Name),
      cloud: {
        eks: {
          ...this._externalClusterService.externalCluster.cloud?.eks,
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
