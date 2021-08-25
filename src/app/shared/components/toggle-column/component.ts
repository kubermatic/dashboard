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

import {Component, Input} from '@angular/core';
import * as _ from 'lodash';

enum Width {
  Indicator = 50,
  Padding = 10,
  AWS = 40,
  Anexia = 60,
  VSphere = 75,
  Azure = 80,
  BYO = 85,
  DefaultProvider = 95,
}

@Component({
  selector: 'km-toggle-column',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ToggleColumnComponent {
  @Input() providers: string[] = [];
  @Input() labels: object = {};
  @Input() maxColumnWidth = 0;
  @Input() isToggled = false;
  columnMaxInput = 0;

  displayLabels(): boolean {
    return (this.isToggled && !_.isEmpty(this.labels)) || (_.isEmpty(this.providers) && !_.isEmpty(this.labels));
  }

  getProviders(): string[] {
    this.calculateWidth(this.providers);

    if (!!this.providers && this.isToggled) {
      return this.providers;
    }
    if (this.maxColumnWidth > 0) {
      if (!!this.providers && this.providers.length > this.columnMaxInput) {
        return this.providers.slice(0, this.columnMaxInput);
      }
      return this.providers;
    }
    return [];
  }

  calculateWidth(providers: string[]): void {
    let calculatedWidth = this.maxColumnWidth - Width.Indicator;
    let providerCount = 0;
    if (providers) {
      for (const p of providers) {
        if (calculatedWidth >= 0) {
          calculatedWidth = calculatedWidth - this.providerWidth(p) - Width.Padding;
          if (calculatedWidth >= 0) {
            providerCount += 1;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    this.columnMaxInput = providerCount;
  }

  providerWidth(provider): number {
    switch (provider) {
      case 'aws':
        return Width.AWS;
      case 'anexia':
      case 'packet':
        return Width.Anexia;
      case 'vsphere':
        return Width.VSphere;
      case 'azure':
        return Width.Azure;
      case 'bringyourown':
        return Width.BYO;
      default:
        return Width.DefaultProvider;
    }
  }

  displayHiddenItemsLength(): boolean {
    return (
      (!_.isEmpty(this.providers) && this.providers.length > this.columnMaxInput) ||
      (!_.isEmpty(this.providers) && this.providers.length >= this.columnMaxInput && !_.isEmpty(this.labels))
    );
  }

  getHiddenItemsLength(): string {
    const sign = this.isToggled ? '−' : '+';
    let count = 0;
    if (!_.isEmpty(this.providers)) {
      count += this.providers.length - this.columnMaxInput;
    }
    if (!_.isEmpty(this.labels)) {
      count += Object.keys(this.labels).length;
    }

    return count > 0 ? sign + count : '';
  }
}
