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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CredentialsType} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterService} from '@core/services/cluster';
import {OpenstackCloudSpecPatch, ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

enum Control {
  Default = 'default',
  Application = 'application',
  Domain = 'domain',
  Username = 'username',
  Password = 'password',
  Project = 'project',
  ProjectID = 'projectID',
  ApplicationCredentialID = 'applicationCredentialID',
  ApplicationCredentialSecret = 'applicationCredentialSecret',
}

@Component({
  selector: 'km-openstack-provider-settings',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class OpenstackProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Control = Control;
  readonly CredentialsType = CredentialsType;

  form: FormGroup;
  credentialsType = CredentialsType.Default;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Control.Domain]: this._builder.control('', Validators.required),
      [Control.Default]: this._builder.group({
        [Control.Username]: this._builder.control('', Validators.required),
        [Control.Password]: this._builder.control('', Validators.required),
        [Control.Project]: this._builder.control('', Validators.required),
        [Control.ProjectID]: this._builder.control('', Validators.required),
      }),
      [Control.Application]: this._builder.group({
        [Control.ApplicationCredentialID]: this._builder.control('', Validators.required),
        [Control.ApplicationCredentialSecret]: this._builder.control('', Validators.required),
      }),
    });

    this.form.valueChanges
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._clusterService.changeProviderSettingsPatch(this._getProviderSettingsPatch());
      });

    this.form.controls[Control.Default]
      .get(Control.Project)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const projectIDControl = this.defaultCredentialsForm.get(Control.ProjectID);
        value ? projectIDControl.disable() : projectIDControl.enable();
      });

    this.form.controls[Control.Default]
      .get(Control.ProjectID)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const projectControl = this.defaultCredentialsForm.get(Control.Project);
        value ? projectControl.disable() : projectControl.enable();
      });

    this.onCredentialsTypeChanged(this.credentialsType);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get defaultCredentialsForm(): FormGroup {
    return this.form?.controls[Control.Default] as FormGroup;
  }

  get applicationCredentialsForm(): FormGroup {
    return this.form?.controls[Control.Application] as FormGroup;
  }

  onCredentialsTypeChanged(value: CredentialsType): void {
    this.credentialsType = value;
    this.form.reset();
    switch (this.credentialsType) {
      case CredentialsType.Default:
        this.defaultCredentialsForm.enable();
        this.applicationCredentialsForm.disable();
        this.form.get(Control.Domain).setValidators(Validators.required);
        break;
      case CredentialsType.Application:
        this.applicationCredentialsForm.enable();
        this.defaultCredentialsForm.disable();
        this.form.get(Control.Domain).clearValidators();
        break;
    }
  }

  private _getProviderSettingsPatch(): ProviderSettingsPatch {
    const openstack = {
      domain: this.form.get(Control.Domain).value,
    } as OpenstackCloudSpecPatch;
    switch (this.credentialsType) {
      case CredentialsType.Default:
        openstack.username = this.defaultCredentialsForm.get(Control.Username).value;
        openstack.password = this.defaultCredentialsForm.get(Control.Password).value;
        openstack.project = this.defaultCredentialsForm.get(Control.Project).value;
        openstack.projectID = this.defaultCredentialsForm.get(Control.ProjectID).value;
        break;
      case CredentialsType.Application:
        openstack.applicationCredentialID = this.applicationCredentialsForm.get(Control.ApplicationCredentialID).value;
        openstack.applicationCredentialSecret = this.applicationCredentialsForm.get(
          Control.ApplicationCredentialSecret
        ).value;
        break;
    }
    return {
      cloudSpecPatch: {
        openstack,
      },
      isValid: this.form.valid,
    };
  }
}
