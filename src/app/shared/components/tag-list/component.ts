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

enum Controls {
  Tags = 'tags',
}

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
  @Input() title: string;
  @Input() label: string;
  @Input() description = 'Use commas or enter key as the separators.';
  @Input() placeholder: string;
  @Input() validationPatternError = 'Pattern is not valid.';
  @Input() validationPattern: string;
  @Input() tags: string[] = [];
  @Input() separatorKeysCodes: number[] = [ENTER, COMMA];
  @Output() tagsChange = new EventEmitter<string[]>();

  form: FormGroup;
  readonly controls = Controls;
  validatingRegex: RegExp;

  addOnBlur = true;
  selectable = false;
  removable = true;
  private _unsubscribe = new Subject<void>();

  ngOnInit(): void {
    this.form = new FormGroup({[Controls.Tags]: new FormControl([], [this.validateNoDuplicates])});

    if (this.validationPattern) {
      this.validatingRegex = new RegExp(this.validationPattern);
      this.form.get([Controls.Tags]).addValidators(this.validatePattern.bind(this));
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (!value) {
      return;
    }

    this.tags.push(value.trim());

    // Clear the input value
    event.chipInput!.clear();
    this._updateTags();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
    this._updateTags();
  }

  validateNoDuplicates(tags: FormControl) {
    if (!tags.value) {
      return null;
    }

    const set = new Set(tags.value);
    if (set.size !== tags.value.length) {
      return {
        alreadyExists: {valid: true},
      };
    }
    return null;
  }

  validatePattern(tags: FormControl) {
    if (!tags.value) {
      return null;
    }

    for (const tag of tags.value) {
      if (!this.validatingRegex.test(tag)) {
        return {
          pattern: {valid: true},
        };
      }
    }
    return null;
  }

  private _updateTags(): void {
    // Emit the change event.
    this.tagsChange.emit(this.tags);
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.get(Controls.Tags).setValue(obj, {emitEvent: false});
      this.form.get(Controls.Tags).updateValueAndValidity();
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
