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
import {PresetModel} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Injectable({providedIn: 'root'})
export class PresetDialogService {
  providerChanges = new EventEmitter<NodeProvider>();
  preset: PresetModel = new PresetModel();

  private _provider: NodeProvider;
  // Settings step child form validation status has to be shared through the service
  // with the preset dialog wizard as dynamically created child forms using CVA are
  // not added to the parent form until user manually enters something into the child form.
  // This is just a workaround. Can be refactored if better suited solution is found.
  private _settingsStepValidity = false;

  get isSettingsStepValid(): boolean {
    return this._settingsStepValidity;
  }

  set settingsStepValidity(valid: boolean) {
    this._settingsStepValidity = valid;
  }

  get provider(): NodeProvider {
    return this._provider;
  }

  set provider(provider: NodeProvider) {
    this._provider = provider;
    this.preset.spec[provider] = {};
    this.providerChanges.emit(this._provider);
  }

  // Presets cannot be created for those providers
  get unsupportedProviders(): NodeProvider[] {
    return [NodeProvider.BAREMETAL, NodeProvider.BRINGYOUROWN, NodeProvider.NONE];
  }
}
