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

import {Component, forwardRef} from '@angular/core';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';

export enum Controls {
  ServiceAccount = 'serviceAccount',
  Zone = 'zone',
}

@Component({
  selector: 'km-gke-cluster',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GKEClusterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GKEClusterComponent),
      multi: true,
    },
  ],
})
export class GKEClusterComponent {
  constructor(private readonly _externalClusterService: ExternalClusterService) {}

  update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        gke: {
          name: '',
          serviceAccount: '',
          zone: '',
        },
      },
    };
  }
}
