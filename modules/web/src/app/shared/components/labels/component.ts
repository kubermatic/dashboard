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

import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';

@Component({
  selector: 'km-labels',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class LabelsComponent implements OnInit, OnChanges {
  @Input() labels = {};
  @Input() limit: number;
  @Input() emptyMessage = '';
  @Input() oneLineLimit = false;
  @ViewChild('chipListLabels') chipListLabels: ElementRef;

  labelKeys: string[] = [];
  showHiddenLabels = false;
  hideExtraLabels = false;

  ngOnInit(): void {
    this._updateLabelKeys();
  }

  ngOnChanges(_: SimpleChanges): void {
    this._updateLabelKeys();
  }

  getHiddenLabels(): string {
    let hiddenLabels = '';
    for (let i = this.limit; i < this.labelKeys.length; i++) {
      hiddenLabels += this.labelKeys[i];
      if (this.labels[this.labelKeys[i]]) {
        hiddenLabels += `: ${this.labels[this.labelKeys[i]]}`;
      }
      if (i < this.labelKeys.length - 1) {
        hiddenLabels += ', ';
      }
    }
    return hiddenLabels;
  }

  toggleHiddenLabels(): void {
    this.showHiddenLabels = !this.showHiddenLabels;
  }

  checkLabelsHeight(): boolean {
    const labelsElem = 24;
    if (this.chipListLabels?.nativeElement?.parentElement.offsetHeight > labelsElem) {
      this.hideExtraLabels = true;
    } else {
      this.hideExtraLabels = false;
    }
    return this.oneLineLimit && this.hideExtraLabels;
  }

  private _updateLabelKeys(): void {
    this.labelKeys = [];
    if (Array.isArray(this.labels)) {
      this.labelKeys = this.labels;
    } else {
      if (this.labels instanceof Object) {
        Object.keys(this.labels).forEach(key => {
          // Do not display nullified (marked for removal) labels.
          if (this.labels[key] !== null) {
            this.labelKeys.push(key);
          }
        });
      }
    }
  }
}
