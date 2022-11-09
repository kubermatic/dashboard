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

import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'km-terminal-status-bar',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class TerminalStatusBarComponent {
  @Input() showCloseButton: boolean;

  @Output() close = new EventEmitter<void>();
  @Output() reconnect = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onReconnect(): void {
    this.reconnect.emit();
  }
}
