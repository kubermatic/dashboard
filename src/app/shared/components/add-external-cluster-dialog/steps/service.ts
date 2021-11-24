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

import {EventEmitter, Injectable} from '@angular/core';
import {ExternalCluster, ExternalClusterProvider} from '@shared/entity/external-cluster';

@Injectable({providedIn: 'root'})
export class ExternalClusterService {
  providerChanges = new EventEmitter<ExternalClusterProvider>();
  private _provider: ExternalClusterProvider;
  private _externalCluster: ExternalCluster = ExternalCluster.new();
  private _credentialsStepValidity = false;

  get provider(): ExternalClusterProvider {
    return this._provider;
  }

  set provider(provider: ExternalClusterProvider) {
    this._provider = provider;
    this.providerChanges.emit(this._provider);
  }

  get externalCluster(): ExternalCluster {
    return this._externalCluster;
  }

  set externalCluster(externalCluster: ExternalCluster) {
    this._externalCluster = externalCluster;
  }

  get isCredentialsStepValid(): boolean {
    return this._credentialsStepValidity;
  }

  set credentialsStepValidity(valid: boolean) {
    this._credentialsStepValidity = valid;
  }
}
