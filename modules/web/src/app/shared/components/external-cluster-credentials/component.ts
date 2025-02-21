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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {Subject} from 'rxjs';

enum Controls {
  Settings = 'settings',
}

@Component({
  selector: 'km-external-cluster-credentials-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class CredentialsStepComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  readonly Provider = ExternalClusterProvider;
  form: FormGroup;
  provider: ExternalClusterProvider;
  @Input() title: string;
  @Input() hideLogo = false;

  constructor(private readonly _externalClusterService: ExternalClusterService) {}

  ngOnInit(): void {
    this._externalClusterService.providerChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => (this.provider = provider));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
