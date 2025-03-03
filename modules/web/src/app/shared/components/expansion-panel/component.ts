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
import {shrinkGrow} from '@shared/animations/grow';

@Component({
  selector: 'km-expansion-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [shrinkGrow],
  standalone: false,
})
export class ExpansionPanelComponent {
  private _initialized = false;
  @Input() expandLabel = 'Show more';
  @Input() collapseLabel = 'Show less';

  private _expanded = false;

  get expanded(): boolean {
    return this._expanded;
  }

  @Input()
  set expanded(expanded: boolean) {
    if (this._initialized || expanded === null || expanded === undefined) {
      return;
    }

    this._expanded = expanded;
    this._initialized = true;
  }

  onClick(): void {
    this._expanded = !this._expanded;
  }
}
