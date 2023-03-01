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

import {Component, Inject} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';
import {NotificationService} from '@core/services/notification';
import {PresetsService} from '@core/services/wizard/presets';
import {Preset} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable} from 'rxjs';
import {take} from 'rxjs/operators';

export interface EditPresetDialogData {
  preset: Preset;
}

@Component({
  selector: 'km-edit-preset-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EditPresetDialogComponent {
  creating = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditPresetDialogData,
    private readonly _presetsService: PresetsService,
    private readonly _notificationService: NotificationService
  ) {}

  getObservable(provider: NodeProvider, enabled: boolean): Observable<Preset> {
    return this._presetsService.updateStatus(this.data.preset.name, {enabled: enabled}, provider).pipe(take(1));
  }

  onNext(provider: NodeProvider, enabled: boolean): void {
    const idx = this.data.preset.providers.findIndex(p => p.name === provider);
    this.data.preset.providers[idx].enabled = enabled;
    this._notificationService.success(
      `${enabled ? 'Enabled' : 'Disabled'} the ${provider} provider for the preset ${this.data.preset.name}`
    );
  }
}
