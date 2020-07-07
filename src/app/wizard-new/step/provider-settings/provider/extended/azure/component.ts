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
import {merge} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {AzureCloudSpec, CloudSpec, Cluster, ClusterSpec} from '../../../../../../shared/entity/cluster';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

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

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService
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

    merge(
      this.form.get(Controls.ResourceGroup).valueChanges,
      this.form.get(Controls.RouteTable).valueChanges,
      this.form.get(Controls.SecurityGroup).valueChanges,
      this.form.get(Controls.Subnet).valueChanges,
      this.form.get(Controls.VNet).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
            resourceGroup: this.form.get(Controls.ResourceGroup).value,
            routeTable: this.form.get(Controls.RouteTable).value,
            securityGroup: this.form.get(Controls.SecurityGroup).value,
            subnet: this.form.get(Controls.Subnet).value,
            vnet: this.form.get(Controls.VNet).value,
          } as AzureCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
