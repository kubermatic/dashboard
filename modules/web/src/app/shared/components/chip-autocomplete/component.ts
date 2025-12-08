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

import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';
import {KmValidators} from '@shared/validators/validators';
import {Subject} from 'rxjs';
import {debounceTime, map, takeUntil} from 'rxjs/operators';

enum Controls {
  Tags = 'tags',
  Filter = 'filter',
}

/**
 * @title Chips Autocomplete
 */
@Component({
  selector: 'km-chip-autocomplete',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipAutocompleteComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ChipAutocompleteComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ChipAutocompleteComponent implements OnChanges, OnInit, OnDestroy, ControlValueAccessor, Validator {
  readonly Controls = Controls;
  form: FormGroup;
  filteredTags: string[] = [];
  selectedTags: string[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
  @Input() label: string;
  @Input() title: string;
  @Input() tags: string[] = [];
  @Input() disabled = false;
  @Input() description = 'Use comma, enter or space key as the separator.';
  @Input() placeholder = 'Select single or multiple values';
  @Input() required = false;
  @Input() patternError = 'Invalid pattern';
  @Input() pattern: string;
  @Output() onChange = new EventEmitter<string[]>();
  @ViewChild('tagInput') tagInput: ElementRef;
  private readonly _debounceTime = 250;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _builder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.tags) {
      this.filteredTags = this._removeSelectedTagsFromList();
    }
    if (changes?.disabled && this.form) {
      if (this.disabled) {
        this.form.get(Controls.Tags).disable();
        this.form.get(Controls.Tags).clearValidators();
      } else if (this.form.get(Controls.Tags).disabled) {
        this.form.get(Controls.Tags).enable();
        this.form.get(Controls.Tags).setValidators(this._validators());
        this.form.get(Controls.Tags).updateValueAndValidity();
      }
    }
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addTag(event: MatChipInputEvent): void {
    const value = event.value?.trim();
    if (value) {
      this.selectedTags.push(value);
    }
    event.chipInput?.clear();
    this._valueUpdated();
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);

    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
    this._valueUpdated();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedTags.push(event.option.viewValue);
    this.tagInput.nativeElement.value = '';
    this._valueUpdated();
  }

  validate(_: AbstractControl): ValidationErrors {
    return this.form.get(Controls.Tags)?.valid ? null : this.form.get(Controls.Tags)?.errors;
  }

  writeValue(tags: string[]): void {
    this.form.get(Controls.Tags).setValue(tags, {emitEvent: false});
    this.selectedTags = tags;
    this._valueUpdated();
  }

  registerOnChange(fn: () => unknown): void {
    this.form.get(Controls.Tags).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: () => unknown): void {}

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Filter]: this._builder.control(''),
      [Controls.Tags]: this._builder.control([], this._validators()),
    });

    if (this.disabled) {
      this.form.get(Controls.Tags).disable();
    }
  }

  private _initSubscriptions() {
    this.form
      .get(Controls.Filter)
      .valueChanges.pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        map((tag: string) => {
          return tag ? this._filter(tag) : this.tags.slice();
        })
      )
      .subscribe(data => {
        this.filteredTags = this._removeSelectedTagsFromFilterList(data);
      });
  }

  private _valueUpdated() {
    this._patchValue();
    this.filteredTags = this._removeSelectedTagsFromList();
    this.onChange.emit(this.selectedTags);
  }

  private _patchValue() {
    this.form.patchValue({
      [Controls.Filter]: '',
      [Controls.Tags]: this.selectedTags,
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.tags?.filter(tag => tag.toLowerCase().includes(filterValue)) || [];
  }

  private _removeSelectedTagsFromFilterList(tags: string[]): string[] {
    return tags?.filter(tag => !this.selectedTags?.includes(tag)) || [];
  }

  private _removeSelectedTagsFromList(): string[] {
    return this.tags?.filter(tag => !this.selectedTags?.includes(tag)) || [];
  }

  private _validators(): ValidatorFn[] {
    const validators = [KmValidators.unique()];

    if (this.required) {
      validators.push(Validators.required);
    }

    if (this.pattern) {
      validators.push(KmValidators.chipPattern(this.pattern));
    }
    return validators;
  }
}
