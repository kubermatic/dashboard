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

import {ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {fadeInOut} from '../../animations/fade';

@Component({
    selector: 'km-spinner-with-confirmation',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    animations: [fadeInOut],
    standalone: false
})
export class SpinnerWithConfirmationComponent implements OnChanges {
  private readonly _defaultTimeout = 3000;
  isSaveConfirmationVisible = false;
  @Input() isSaved = true;
  @Input() confirmationTimeout = this._defaultTimeout;

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isSaved && !changes.isSaved.isFirstChange()) {
      this.isSaveConfirmationVisible = this.isSaved;
      setTimeout(_ => {
        this.isSaveConfirmationVisible = false;
        this._cdr.detectChanges();
      }, this.confirmationTimeout);
    }
  }
}
