// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, Output} from '@angular/core';
import {LayoutType} from '@shared/model/Terminal';

@Component({
  selector: 'km-overlay-terminal',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class OverlayTerminalComponent {
  readonly layoutType = LayoutType;

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
