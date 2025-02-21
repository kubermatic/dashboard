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
import {Event} from '@shared/entity/event';

@Component({
    selector: 'km-event-card',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class EventCardComponent {
  @Input() events: Event[] = [];

  isShowEvents = false;

  hasEvents(): boolean {
    return this.events && this.events.length > 0;
  }

  toggleEvents(): void {
    this.isShowEvents = !this.isShowEvents;
  }

  getTypeIcon(): string {
    if (this.events.filter(event => event.type === 'Warning').length > 0) {
      return 'km-icon-warning-event';
    } else if (this.events.filter(event => event.type === 'Normal').length > 0) {
      return 'km-icon-check';
    }
    return '';
  }
}
