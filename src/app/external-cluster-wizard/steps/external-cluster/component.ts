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

import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {MasterVersion} from '@shared/entity/cluster';

@Component({
  selector: 'km-external-cluster-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExternalClusterStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ExternalClusterStepComponent),
      multi: true,
    },
  ],
})
export class ExternalClusterStepComponent implements OnInit, OnDestroy {
  readonly provider = ExternalClusterProvider;
  masterVersions: MasterVersion[] = [];
  selectedProvider: ExternalClusterProvider;
  @Input() projectID: string;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _externalClusterService: ExternalClusterService) {}

  ngOnInit(): void {
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getVersions(provider: ExternalClusterProvider) {
    this._externalClusterService
      .getMasterVersions(provider)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(versions => {
        this.masterVersions = versions;
      });
  }

  private _initSubscriptions() {
    this._externalClusterService.providerChanges
      .pipe(filter(provider => !!provider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => {
        this.selectedProvider = provider;
        this._getVersions(provider);
      });
  }
}
