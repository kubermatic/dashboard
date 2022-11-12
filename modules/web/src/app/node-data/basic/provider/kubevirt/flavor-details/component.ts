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
import _ from 'lodash';
import {KubeVirtVMInstancePreset} from '@shared/entity/provider/kubevirt';

export interface DialogDataInput {
  flavor: KubeVirtVMInstancePreset;
}

@Component({
  selector: 'km-flavor-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class FlavorDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) private _data: DialogDataInput) {}

  get flavor(): KubeVirtVMInstancePreset {
    return this._data.flavor;
  }

  get spec(): unknown {
    return JSON.parse(this.flavor.spec);
  }
}
