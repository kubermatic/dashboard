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
import {ThemePalette} from '@angular/material/core';
import {getPercentage} from '../../utils/common';

@Component({
  selector: 'km-property-usage',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class PropertyUsageComponent {
  @Input() name: string;
  @Input() used: number;
  @Input() total: number;
  @Input() unit: string;
  @Input() color: ThemePalette = 'primary';

  getPercentage(): number | undefined {
    return this.total && this.used ? getPercentage(this.total, this.used) : undefined;
  }

  getTooltip(): string {
    return this.getPercentage() ? `${this.getPercentage()}%` : '';
  }
}
