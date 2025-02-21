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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {AWSCloudSpec, CloudSpec, Cluster, ClusterSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import _ from 'lodash';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';

enum Controls {
  SecurityGroup = 'securityGroup',
  RouteTableID = 'routeTableID',
  InstanceProfileName = 'instanceProfileName',
  RoleARN = 'roleARN',
}

@Component({
  selector: 'km-wizard-aws-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSProviderExtendedComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class AWSProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isLoadingSecurityGroups = false;
  securityGroups: string[] = [];
  securityGroupValidators = [Validators.pattern('sg-(\\w{8}|\\w{17})')];

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('AWS Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.RouteTableID]: this._builder.control('', Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      [Controls.InstanceProfileName]: this._builder.control(''),
      [Controls.RoleARN]: this._builder.control(''),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AWS))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._presets.enablePresets(AWSCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.aws));
      });

    this._clusterSpecService.clusterChanges
      .pipe(
        filter(_ => this._clusterSpecService.provider === NodeProvider.AWS),
        debounceTime(this._debounceTime),
        tap(_ => (!this.hasRequiredCredentials() ? this._clearSecurityGroup() : null)),
        switchMap(_ => this._securityGroupObservable()),
        takeUntil(this._unsubscribe)
      )
      .subscribe(securityGroups => {
        this.securityGroups = securityGroups;
        this._setIsLoadingSecurityGroup(false);
      });

    merge(
      this.form.get(Controls.RouteTableID).valueChanges,
      this.form.get(Controls.InstanceProfileName).valueChanges,
      this.form.get(Controls.RoleARN).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    this.form
      .get(Controls.SecurityGroup)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(sg => {
        const awsCloudSpec = this._clusterSpecService.cluster.spec.cloud?.aws;
        if (awsCloudSpec) {
          awsCloudSpec.securityGroupID = sg;
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasRequiredCredentials(): boolean {
    if (
      !!this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleARN ||
      !!this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleExternalID
    ) {
      return (
        !!this._clusterSpecService.cluster.spec.cloud.aws.accessKeyID &&
        !!this._clusterSpecService.cluster.spec.cloud.aws.secretAccessKey &&
        !!this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleExternalID &&
        !!this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleARN
      );
    }

    return (
      !!this._clusterSpecService.cluster.spec.cloud.aws.accessKeyID &&
      !!this._clusterSpecService.cluster.spec.cloud.aws.secretAccessKey
    );
  }

  private _securityGroupObservable(): Observable<string[]> {
    return this._presets
      .provider(NodeProvider.AWS)
      .accessKeyID(this._clusterSpecService.cluster.spec.cloud.aws.accessKeyID)
      .secretAccessKey(this._clusterSpecService.cluster.spec.cloud.aws.secretAccessKey)
      .assumeRoleARN(this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleARN)
      .assumeRoleExternalID(this._clusterSpecService.cluster.spec.cloud.aws.assumeRoleExternalID)
      .securityGroups(this._clusterSpecService.datacenter, () => this._setIsLoadingSecurityGroup(true))
      .pipe(
        map(securityGroups => _.sortBy(securityGroups, sg => sg.toLowerCase())),
        catchError(() => {
          this._clearSecurityGroup();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _setIsLoadingSecurityGroup(isLoading: boolean): void {
    this.isLoadingSecurityGroups = isLoading;
    this._cdr.detectChanges();
  }

  private _clearSecurityGroup(): void {
    this.securityGroups = [];
    this.form.get(Controls.SecurityGroup).setValue(AutocompleteInitialState);
    this._setIsLoadingSecurityGroup(false);
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          aws: {
            instanceProfileName: this.form.get(Controls.InstanceProfileName).value,
            roleARN: this.form.get(Controls.RoleARN).value,
            routeTableID: this.form.get(Controls.RouteTableID).value,
          } as AWSCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
