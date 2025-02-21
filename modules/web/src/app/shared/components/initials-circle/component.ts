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

import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ProjectOwner} from '../../entity/project';

@Component({
    selector: 'km-initials-circle',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class InitialsCircleComponent implements OnInit, OnChanges {
  @Input() owners: ProjectOwner[];
  @Input() limit: number;

  shortNames: string[] = [];

  ngOnInit(): void {
    this._updateLabelKeys();
  }

  ngOnChanges(_: SimpleChanges): void {
    this._updateLabelKeys();
  }

  getHiddenOwners(): string {
    const hiddenOwners = [];
    for (const i in this.owners) {
      if (Object.prototype.hasOwnProperty.call(this.owners, i)) {
        hiddenOwners.push(this.owners[i].name);
      }
    }
    return hiddenOwners.join(', ');
  }

  private _updateLabelKeys(): void {
    this.shortNames = [];

    for (const owner in this.owners) {
      if (Object.prototype.hasOwnProperty.call(this.owners, owner)) {
        const maxLength = 3;
        const capitalLetters = this.owners[owner].name.match(/\b(\w)/g);
        const short = capitalLetters.slice(0, maxLength).join('').toUpperCase();
        this.shortNames.push(short);
      }
    }
  }
}
