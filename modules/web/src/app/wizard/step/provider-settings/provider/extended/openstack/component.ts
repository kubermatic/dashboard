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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {
  CredentialsType,
  OpenstackCredentialsTypeService,
} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, OpenstackCloudSpec} from '@shared/entity/cluster';
import {OpenstackLoadBalancerClass} from '@shared/entity/provider/openstack';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, switchMap, take, takeUntil} from 'rxjs/operators';
import { LoadBalancerClassDialogData, OpenstackLoadBalancerClassDialogComponent } from './loadbalancer-class-dialog/component';


enum Controls {
  Credentials = 'credentials',
  EnableIngressHostname = 'enableIngressHostname',
  IngressHostnameSuffix = 'ingressHostnameSuffix',
}

@Component({
  selector: 'km-wizard-openstack-provider-extended',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderExtendedComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class OpenstackProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly CredentialsType = CredentialsType;
  loadBalancerClasses: OpenstackLoadBalancerClass[] = [];

  get credentialsType(): CredentialsType {
    return this._credentialsTypeService.credentialsType;
  }

  get loadBalancerClassCount(): number {
    return this.loadBalancerClasses?.length || 0;
  }

  get isLoadBalancerClassButtonDisabled(): boolean {
    const cloudSpec = this._clusterSpecService.cluster?.spec?.cloud?.openstack;
    if (!cloudSpec) {
      return true;
    }

    const datacenter = this._clusterSpecService.datacenter;
    if (!datacenter) {
      return true;
    }

    // Check if preset is selected
    if (this._presets.preset) {
      return false;
    }

    // Check if credentials are available
    if (this._credentialsTypeService.credentialsType === CredentialsType.Default) {
      return !(cloudSpec.username && cloudSpec.password && cloudSpec.domain);
    }
    return !(cloudSpec.applicationCredentialID && cloudSpec.applicationCredentialSecret);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService,
    private readonly _projectService: ProjectService,
    private readonly _presets: PresetsService,
    private readonly _matDialog: MatDialog
  ) {
    super('Openstack Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Credentials]: this._builder.control(''),
      [Controls.EnableIngressHostname]: this._builder.control(false),
      [Controls.IngressHostnameSuffix]: this._builder.control({value: '', disabled: true}),
    });

    // Load existing load balancer classes if they exist
    const existingClasses = this._clusterSpecService.cluster?.spec?.cloud?.openstack?.loadBalancerClasses;
    if (existingClasses?.length > 0) {
      this.loadBalancerClasses = [...existingClasses];
    }

    merge(
      this._credentialsTypeService.credentialsTypeChanges,
      this._presets.presetChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.clearLoadBalancerClasses());

    this.form
      .get(Controls.EnableIngressHostname)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        this._enable(value, Controls.IngressHostnameSuffix);
      });

    merge(
      this.form.get(Controls.EnableIngressHostname).valueChanges,
      this.form.get(Controls.IngressHostnameSuffix).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  openLoadBalancerClassDialog(): void {
    this._projectService.selectedProject
      .pipe(
        take(1),
        switchMap(project => {
          const dialogData: LoadBalancerClassDialogData = {
            loadBalancerClasses: this.loadBalancerClasses,
            projectID: project.id,
          };

          const dialogRef = this._matDialog.open(OpenstackLoadBalancerClassDialogComponent, {
            data: dialogData,
            disableClose: true,
          });

          return dialogRef.afterClosed();
        }),
        filter(Boolean)
      )
      .subscribe((classes: OpenstackLoadBalancerClass[]) => {
        this.loadBalancerClasses = classes;
        this._clusterSpecService.cluster = this._getClusterEntity();
      });
  }

  clearLoadBalancerClasses(): void {
    this.loadBalancerClasses = [];
    this._clusterSpecService.cluster = this._getClusterEntity();
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          openstack: {
            enableIngressHostname: this.form.get(Controls.EnableIngressHostname).value || null,
            ingressHostnameSuffix: this.form.get(Controls.IngressHostnameSuffix).value || null,
            loadBalancerClasses: this.loadBalancerClasses?.length > 0 ? this.loadBalancerClasses : null,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).reset();
      this.form.get(name).disable();
    }
  }
}
