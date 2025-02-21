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
import {merge, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@core/services/external-cluster';
import {verifyJSON, verifyYAML} from '@shared/utils/common';

export enum Controls {
  Name = 'name',
}

@Component({
  selector: 'km-custom-credentials',
  templateUrl: './template.html',
  standalone: false,
})
export class CustomCredentialsComponent implements OnInit, OnDestroy {
  kubeconfig = '';
  form: FormGroup;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
    });

    merge(this.form.valueChanges, this.form.statusChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.update());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  update(): void {
    this._externalClusterService.credentialsStepValidity =
      this.form.valid && (verifyYAML(this.kubeconfig) || verifyJSON(this.kubeconfig));
    this._externalClusterService.externalCluster = {
      name: this.form.get(Controls.Name).value,
      kubeconfig: btoa(this.kubeconfig),
    };
  }
}
