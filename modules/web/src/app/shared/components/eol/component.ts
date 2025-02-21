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

import {Component, Input} from '@angular/core';
import {EndOfLifeService} from '@core/services/eol';

export enum Type {
  Badge = 'badge',
  Chip = 'chip',
}

@Component({
    selector: 'km-cluster-type-eol',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    standalone: false
})
export class ClusterTypeEOLComponent {
  @Input() version: string;
  @Input() type: Type = Type.Chip;

  readonly displayType = Type;

  constructor(private readonly _eolService: EndOfLifeService) {}

  get eolVersion(): string {
    return this._eolService.cluster.findVersion(this.version);
  }

  get date(): Date {
    return this._eolService.cluster.getDate(this.version);
  }

  isAfter(): boolean {
    return this._eolService.cluster.isAfter(this.version);
  }

  isBefore(): boolean {
    return this._eolService.cluster.isBefore(this.version);
  }
}
