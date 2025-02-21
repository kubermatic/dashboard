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
import {SSHKey} from '../../entity/ssh-key';

@Component({
  selector: 'km-ssh-key-list',
  templateUrl: './template.html',
  standalone: false,
})
export class SSHKeyListComponent {
  private readonly _defaultMaxDisplayed = 3;

  @Input() sshKeys: SSHKey[] = [];
  @Input() maxDisplayed = this._defaultMaxDisplayed;

  getDisplayed(): string {
    return this.sshKeys
      .slice(0, this.maxDisplayed)
      .map(key => key.name)
      .join(', ');
  }

  getTruncatedSSHKeys(): string {
    return this.sshKeys
      .slice(this.maxDisplayed)
      .map(key => key.name)
      .join(', ');
  }
}
