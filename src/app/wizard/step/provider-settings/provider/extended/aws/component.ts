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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetsService} from '@core/services/wizard/presets.service';
import {AWSCloudSpec, CloudSpec, Cluster, ClusterSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {AWSSecurityGroup} from '@shared/entity/provider/aws';
import * as _ from 'lodash';

enum Controls {
  SecurityGroup = 'securityGroup',
  RouteTableID = 'routeTableId',
  InstanceProfileName = 'instanceProfileName',
  RoleARN = 'roleARN',
}

enum SecurityGroupState {
  Loading = 'Loading...',
  Ready = 'Security Group ID',
  Empty = 'No Security Groups IDs Available',
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
})
export class AWSProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  @ViewChild('securityGroupCombobox')
  private readonly _securityGroupCombobox: FilteredComboboxComponent;
  selectedSecurityGroup = '';
  securityGroups: AWSSecurityGroup[] = [];
  securityGroupLabel = SecurityGroupState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('AWS Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.SecurityGroup]: this._builder.control('', Validators.pattern('sg-(\\w{8}|\\w{17})')),
      [Controls.RouteTableID]: this._builder.control('', Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      [Controls.InstanceProfileName]: this._builder.control(''),
      [Controls.RoleARN]: this._builder.control(''),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AWS))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._presets.enablePresets(Object.values(this._clusterService.cluster.spec.cloud.aws).every(value => !value));
      });

    this._clusterService.clusterChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AWS))
      .pipe(tap(_ => (!this._hasRequiredCredentials() ? this._clearSecurityGroup() : null)))
      .pipe(switchMap(_ => this._securityGroupObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSecurityGroups.bind(this));

    merge(
      this.form.get(Controls.RouteTableID).valueChanges,
      this.form.get(Controls.InstanceProfileName).valueChanges,
      this.form.get(Controls.RoleARN).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SecurityGroup:
        return this._hasRequiredCredentials()
          ? 'Specify to attach worker nodes to it, otherwise a new security group will be used.'
          : 'Please enter your credentials first.';
    }

    return '';
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.aws.accessKeyId &&
      !!this._clusterService.cluster.spec.cloud.aws.secretAccessKey
    );
  }

  onSecurityGroupChange(groupId: string): void {
    this._clusterService.cluster.spec.cloud.aws.securityGroupID = groupId;
  }

  private _securityGroupObservable(): Observable<AWSSecurityGroup[]> {
    return this._presets
      .provider(NodeProvider.AWS)
      .accessKeyID(this._clusterService.cluster.spec.cloud.aws.accessKeyId)
      .secretAccessKey(this._clusterService.cluster.spec.cloud.aws.secretAccessKey)
      .datacenter(this._clusterService.cluster.spec.cloud.dc)
      .securityGroups(this._onSecurityGroupLoading.bind(this))
      .pipe(map(securityGroups => _.sortBy(securityGroups, sg => sg.groupName.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearSecurityGroup();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _onSecurityGroupLoading(): void {
    this._clearSecurityGroup();
    this.securityGroupLabel = SecurityGroupState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSecurityGroup(): void {
    this.securityGroups = [];
    this.selectedSecurityGroup = '';
    this.securityGroupLabel = SecurityGroupState.Empty;
    this._securityGroupCombobox.reset();
    this._cdr.detectChanges();
  }

  private _loadSecurityGroups(securityGroups: AWSSecurityGroup[]): void {
    this.securityGroups = securityGroups;
    this.securityGroupLabel = !_.isEmpty(this.securityGroups) ? SecurityGroupState.Ready : SecurityGroupState.Empty;
    this._cdr.detectChanges();
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
            routeTableId: this.form.get(Controls.RouteTableID).value,
          } as AWSCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
