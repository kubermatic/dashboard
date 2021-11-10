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

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, EventEmitter, forwardRef, Input, OnDestroy, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-tag-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagListComponent),
      multi: true,
    },
  ],
})
export class TagListComponent implements OnDestroy, ControlValueAccessor {
  @Input() title = 'Tags';
  @Input() tags: string[] = [];
  @Output() tagsChange = new EventEmitter<string[]>();
  addOnBlur = true;
  selectable = false;
  removable = true;
  form = new FormGroup({tags: new FormControl([])});
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  private _unsubscribe = new Subject<void>();

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._updateTags();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
    this._updateTags();
  }

  private _updateTags(): void {
    // Emit the change event.
    this.tagsChange.emit(this.tags);
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
