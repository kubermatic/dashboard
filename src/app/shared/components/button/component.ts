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

import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'km-button',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ButtonComponent {
  @Input() icon: string;
  @Input() label: string;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() click = new EventEmitter<void>();

  get iconClass(): string {
    return this.loading ? 'km-icon-pending' : this.icon;
  }

  onClick(): void {
    this.loading = true;
    this.click.next();
  }
}
