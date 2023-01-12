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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {PresetList} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class KubeOnePresetsService {
  // True - enabled, false - disabled
  readonly presetStatusChanges = new Subject<boolean>();
  readonly presetChanges = new Subject<string>();

  constructor(private readonly _http: HttpClient) {}

  private _preset: string;

  get preset(): string {
    return this._preset;
  }

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.next(preset);
  }

  enablePresets(enable: boolean): void {
    this.presetStatusChanges.next(enable);
  }

  presets(projectID: string, provider: NodeProvider): Observable<PresetList> {
    const url = `${environment.newRestRoot}/projects/${projectID}/providers/${provider}/presets?disabled=false`;
    return this._http.get<PresetList>(url);
  }
}
