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
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {KubeVirtInstanceType, KubeVirtPreference} from '@shared/entity/provider/kubevirt';

export interface DialogDataInput {
  instanceType: KubeVirtInstanceType;
  preference: KubeVirtPreference;
}

@Component({
    selector: 'km-instance-details',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class InstanceDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) private _data: DialogDataInput) {}

  get instance(): KubeVirtInstanceType {
    return this._data.instanceType;
  }

  get instanceSpec(): unknown {
    return JSON.parse(this.instance.spec);
  }

  get preference(): KubeVirtPreference {
    return this._data.preference;
  }

  get preferenceSpec(): unknown {
    return JSON.parse(this.preference.spec);
  }
}
