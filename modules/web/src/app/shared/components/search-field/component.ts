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

import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'km-search-field',
  templateUrl: 'template.html',
  standalone: false,
})
export class SearchFieldComponent implements OnInit, OnDestroy {
  @Output() queryChange = new EventEmitter<string>();
  formGroup: FormGroup;
  private _subscription = new Subscription();

  ngOnInit() {
    this.formGroup = new FormGroup({query: new FormControl('')});
    this._subscription = this.formGroup.controls.query.valueChanges.subscribe(query => {
      this.queryChange.emit(query ?? '');
    });
  }

  isEmpty(): boolean {
    return !this.formGroup.controls.query.value;
  }

  clear(): void {
    this.formGroup.controls.query.setValue('');
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }
}
