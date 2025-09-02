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

enum TerminalState {
  Expired = 'expired',
  ConnectionLost = 'connectionLost',
  Expiring = 'expiring',
}

@Component({
  selector: 'km-terminal-status-bar',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class TerminalStatusBarComponent {
  @Input() isConnectionLost: boolean;
  @Input() isSessionExpiring: boolean;
  @Input() isTokenExpired: boolean;
  @Output() reconnect = new EventEmitter<void>();
  @Output() extendSession = new EventEmitter<void>();
  @Output() tokenExpired = new EventEmitter<void>();
  terminalState = TerminalState;

  get sessionState(): TerminalState {
    if (this.isTokenExpired) return TerminalState.Expired;
    if (this.isConnectionLost) return TerminalState.ConnectionLost;
    return TerminalState.Expiring;
  }

  onExtendSession(): void {
    this.extendSession.emit();
  }

  onReconnect(): void {
    this.reconnect.emit();
  }

  onTokenExpired(): void {
    this.tokenExpired.emit();
  }
}
