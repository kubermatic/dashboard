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

import {Component, Input, OnChanges} from '@angular/core';
import * as _ from 'lodash';

// provider width according to stylesheet
enum Width {
  Indicator = 45,
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
export class ToggleColumnComponent implements OnChanges {
  @Input() providers: string[] = [];
  @Input() labels: object = {};
  @Input() name: string;
  @Input() maxColumnWidth = 0;
  @Input() isToggled = false;
  private _maxProviderCount = 0;
  private _maxLabelCount = 0;
  private _remainingWidth = 0;

  ngOnChanges(): void {
    this._calculateItemsCount();
  }

  getProviders(): string[] {
    if (!!this.providers && this.isToggled) {
      return this.providers;
    }
    if (this.maxColumnWidth > 0) {
      if (!!this.providers && this.providers.length > this._maxProviderCount) {
        return this.providers.slice(0, this._maxProviderCount);
      }
      return this.providers;
    }
    return [];
  }

  getLabels(): object {
    if (!_.isEmpty(this.labels)) {
      if (this.isToggled) {
        return this.labels;
      }

      if (this.providers) {
        if (this.providers.length > this._maxProviderCount) {
          return {};
        }
      }

      return Object.keys(this.labels)
        .slice(0, this._maxLabelCount)
        .reduce((result, key) => {
          result[key] = this.labels[key];
          return result;
        }, {});
    }
    return {};
  }

  displayHiddenItemsLength(): boolean {
    return (
      (!_.isEmpty(this.providers) && this.providers.length > this._maxProviderCount) ||
      (!_.isEmpty(this.labels) && Object.keys(this.labels).length > this._maxLabelCount)
    );
  }

  getHiddenItemsLength(): string {
    const sign = this.isToggled ? '−' : '+';
    let count = 0;
    if (!_.isEmpty(this.providers)) {
      count += this.providers.length - this._maxProviderCount;
    }
    if (!_.isEmpty(this.labels)) {
      count += Object.keys(this.labels).length - this._maxLabelCount;
    }

    return count > 0 ? sign + count : '';
  }

  // Calculate how many items would fit in one line minus the indicator.
  // As long as width >= 0, the number of providers will be increased.
  private _calculateItemsCount(): void {
    let calculatedWidth = this.maxColumnWidth - Width.Indicator;
    let providerCount = 0;
    if (this.providers) {
      for (const p of this.providers) {
        if (calculatedWidth >= 0) {
          calculatedWidth = calculatedWidth - this._providerWidth(p) - Width.Padding;
          if (calculatedWidth >= 0) {
            providerCount += 1;
            this._remainingWidth = calculatedWidth;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    this._maxProviderCount = providerCount;

    this._calculateLabelsCount();
  }

  private _providerWidth(provider: string): number {
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

  // Calculate how many items would fit in one line minus the indicator
  // and possible providers.
  // As long as width >= 0, the number of labels will be increased.
  private _calculateLabelsCount(): void {
    let calculatedWidth =
      this._remainingWidth > 0 ? this._remainingWidth - Width.Indicator : this.maxColumnWidth - Width.Indicator;
    let labelCount = 0;
    if (!_.isEmpty(this.labels) && !!this.providers && !(this.providers.length > this._maxProviderCount)) {
      Object.entries(this.labels).forEach(([key, value]) => {
        calculatedWidth = calculatedWidth - this._labelWidth(key, value) - Width.Padding;
        if (calculatedWidth >= 0) {
          labelCount += 1;
        }
      });
    }

    this._maxLabelCount = labelCount;
  }

  // To get a valid width of a label to decide whether it still fits
  // into the line, we need to append a mat-chip element.
  // Once we have the width, we remove it again.
  private _labelWidth(key, value): number {
    const matChip = document.createElement('mat-chips');
    matChip.innerHTML = '<div>' + key + '</div><div>' + value + '</div>';
    matChip.className = 'mat-standard-chip';
    matChip.style.visibility = 'hidden';
    matChip.style.position = 'absolute';
    matChip.style.display = 'inline-flex';
    document.body.appendChild(matChip);
    const width = matChip.offsetWidth;
    matChip.parentNode.removeChild(matChip);
    return width;
  }
}
