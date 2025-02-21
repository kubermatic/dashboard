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

import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {verifyYAML, verifyJSON} from '@shared/utils/common';

@Component({
    selector: 'km-validate-json-or-yaml',
    templateUrl: './template.html',
    standalone: false
})
export class ValidateJsonOrYamlComponent implements OnChanges {
  @Input() data: string;
  @Input() isOnlyYAML = false;

  @Output() dataValid = new EventEmitter<boolean>();

  isDataValid = false;

  private _verifyYAML = verifyYAML;
  private _verifyJSON = verifyJSON;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      this._setIsDataValid(this.data);
    }
  }

  private _setIsDataValid(data: string): void {
    if (this.isOnlyYAML) {
      this.isDataValid = this._verifyYAML(data);
    } else {
      this.isDataValid = this._verifyYAML(data) || this._verifyJSON(data);
    }
    this.dataValid.emit(this.isDataValid);
  }
}
