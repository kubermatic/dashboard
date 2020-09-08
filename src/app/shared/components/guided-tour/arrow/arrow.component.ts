// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'guided-tour-arrow',
  templateUrl: './arrow.component.html',
  styleUrls: ['./arrow.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GuidedTourArrowComponent {
  @Input() position = 'top';

  getArrowClass(): string {
    switch (this.position) {
      case 'top':
        return 'guided-tour-arrow-top';
      case 'right':
        return 'guided-tour-arrow-right';
      case 'bottom':
        return 'guided-tour-arrow-bottom';
      case 'left':
        return 'guided-tour-arrow-left';
    }
  }
}
