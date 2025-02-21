// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {KubeOnePresetsService} from '@core/services/kubeone-wizard/kubeone-presets';
import {ExternalCloudSpec, ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneCloudSpec, KubeOneClusterSpec, KubeOneOpenstackCloudSpec} from '@shared/entity/kubeone-cluster';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  AuthURL = 'authURL',
  Username = 'username',
  Password = 'password',
  Domain = 'domain',
  Project = 'project',
  ProjectID = 'projectID',
  Region = 'region',
}

@Component({
  selector: 'km-kubeone-wizard-openstack-credentials-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneOpenstackCredentialsBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneOpenstackCredentialsBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KubeOneOpenstackCredentialsBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    private readonly _presetsService: KubeOnePresetsService
  ) {
    super('Openstack Credentials Basic');
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.AuthURL]: this._builder.control('', [Validators.required]),
      [Controls.Username]: this._builder.control('', [Validators.required]),
      [Controls.Password]: this._builder.control('', [Validators.required]),
      [Controls.Domain]: this._builder.control('', [Validators.required]),
      [Controls.Project]: this._builder.control('', [Validators.required]),
      [Controls.ProjectID]: this._builder.control('', [Validators.required]),
      [Controls.Region]: this._builder.control('', [Validators.required]),
    });
  }

  private _initSubscriptions(): void {
    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.form.reset());

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presetsService.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value))
      );

    this._presetsService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(
      this.form.get(Controls.AuthURL).valueChanges,
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges,
      this.form.get(Controls.Domain).valueChanges,
      this.form.get(Controls.Project).valueChanges,
      this.form.get(Controls.ProjectID).valueChanges,
      this.form.get(Controls.Region).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  private _enable(enable: boolean, name: Controls): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): ExternalCluster {
    return {
      cloud: {
        kubeOne: {
          cloudSpec: {
            openstack: {
              authURL: this.form.get(Controls.AuthURL).value,
              username: this.form.get(Controls.Username).value,
              password: this.form.get(Controls.Password).value,
              domain: this.form.get(Controls.Domain).value,
              project: this.form.get(Controls.Project).value,
              projectID: this.form.get(Controls.ProjectID).value,
              region: this.form.get(Controls.Region).value,
            } as KubeOneOpenstackCloudSpec,
          } as KubeOneCloudSpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalCluster;
  }
}
