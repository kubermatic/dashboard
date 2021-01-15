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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {PresetsService} from '@core/services/wizard/presets.service';
import {AzureCloudSpec, CloudSpec, Cluster, ClusterSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import * as _ from 'lodash';
import {DatacenterService} from '@core/services/datacenter/service';

enum Controls {
  ResourceGroup = 'resourceGroup',
  RouteTable = 'routeTable',
  SecurityGroup = 'securityGroup',
  Subnet = 'subnet',
  VNet = 'vnet',
}

@Component({
  selector: 'km-wizard-azure-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AzureProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AzureProviderExtendedComponent),
      multi: true,
    },
  ],
})
export class AzureProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  resourceGroups: string[] = [];
  securityGroups: string[] = [];

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService
  ) {
    super('Azure Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ResourceGroup]: this._builder.control(''),
      [Controls.RouteTable]: this._builder.control(''),
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.Subnet]: this._builder.control(''),
      [Controls.VNet]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._presets.enablePresets(
          Object.values(this._clusterService.cluster.spec.cloud.azure).every(value => !value)
        );
      });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    this._clusterService.clusterChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(tap(_ => (!this.hasRequiredCredentials() ? this._clearResourceGroup() : null)))
      .pipe(switchMap(_ => this._resourceGroupObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(resourceGroups => (this.resourceGroups = resourceGroups));

    this._clusterService.clusterChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(
        tap(_ =>
          !this.hasRequiredCredentials() || !this.form.get(Controls.ResourceGroup).value
            ? this._clearSecurityGroup()
            : null
        )
      )
      .pipe(switchMap(_ => this._securityGroupObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(securityGroups => (this.securityGroups = securityGroups));

    merge(
      this.form.get(Controls.RouteTable).valueChanges,
      this.form.get(Controls.Subnet).valueChanges,
      this.form.get(Controls.VNet).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));

    this.form
      .get(Controls.ResourceGroup)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(rg => {
        this._clusterService.cluster.spec.cloud.azure.resourceGroup = rg;
      });

    this.form
      .get(Controls.SecurityGroup)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(sg => {
        this._clusterService.cluster.spec.cloud.azure.securityGroup = sg;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasRequiredCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.azure.subscriptionID &&
      !!this._clusterService.cluster.spec.cloud.azure.tenantID &&
      !!this._clusterService.cluster.spec.cloud.azure.clientID &&
      !!this._clusterService.cluster.spec.cloud.azure.clientSecret
    );
  }

  private _resourceGroupObservable(): Observable<string[]> {
    let location = '';
    return this._datacenterService
      .getDatacenter(this._clusterService.cluster.spec.cloud.dc)
      .pipe(take(1))
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterService.cluster.spec.cloud.azure.tenantID)
            .location(location)
            .credential(this._presets.preset)
            .resourceGroups()
            .pipe(
              map(resourceGroups => _.sortBy(resourceGroups, rg => rg.toLowerCase())),
              catchError(() => {
                this._clearResourceGroup();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearResourceGroup(): void {
    this.resourceGroups = [];
    this.form.get(Controls.ResourceGroup).setValue('');
  }

  private _securityGroupObservable(): Observable<string[]> {
    let location = '';
    return this._datacenterService
      .getDatacenter(this._clusterService.cluster.spec.cloud.dc)
      .pipe(take(1))
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterService.cluster.spec.cloud.azure.tenantID)
            .resourceGroup(this._clusterService.cluster.spec.cloud.azure.resourceGroup)
            .location(location)
            .credential(this._presets.preset)
            .securityGroups()
            .pipe(
              map(securityGroups => _.sortBy(securityGroups, sg => sg.toLowerCase())),
              catchError(() => {
                this._clearSecurityGroup();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearSecurityGroup(): void {
    this.securityGroups = [];
    this.form.get(Controls.SecurityGroup).setValue('');
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
          azure: {
            routeTable: this.form.get(Controls.RouteTable).value,
            subnet: this.form.get(Controls.Subnet).value,
            vnet: this.form.get(Controls.VNet).value,
          } as AzureCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
