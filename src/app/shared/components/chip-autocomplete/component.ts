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
  Validators,
} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';
import {Subject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';

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
})
export class ChipAutocompleteComponent implements OnChanges, OnInit, OnDestroy, ControlValueAccessor, Validator {
  readonly Controls = Controls;

  form: FormGroup;
  allTags: string[] = [];
  filteredTags: string[] = [];
  selectedTags: string[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  @Input() label: string;
  @Input() title: string;
  @Input() tags: string[] = [];
  @Input() description = 'Use comma, enter or space key as the separator.';
  @Input() placeholder = 'Select single or multiple values';
  @Input() required = false;

  // Note: Event to emit selected values in order to use this component as independent component.
  @Output() Change = new EventEmitter<string[]>();
  @ViewChild('tagInput') tagInput: any;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _builder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.tags) {
      this.allTags = changes.tags.currentValue;
      this.filteredTags = this.allTags;

      if (this.allTags.length === 0) {
        this.selectedTags = [];
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
    const value = (event.value || '').trim();
    if (value) {
      this.selectedTags.push(value);
    }
    // Clear the input value
    event.chipInput!.clear();
    this._patchValue();
    this.Change.emit(this.selectedTags);
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
    this._patchValue();
    this.filteredTags = this._removeSelectedTagsFromList();
    this.Change.emit(this.selectedTags);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedTags.push(event.option.viewValue);
    this.tagInput.nativeElement.value = '';
    this._patchValue();
    this.filteredTags = this._removeSelectedTagsFromList();
    this.Change.emit(this.selectedTags);
  }

  validate(_: AbstractControl): ValidationErrors {
    return this.form.get(Controls.Tags)?.valid ? null : this.form.get(Controls.Tags)?.errors;
  }

  writeValue(tags: string[]): void {
    if (tags && tags.length > 0) {
      this.form.get(Controls.Tags).setValue(tags, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.form.get(Controls.Tags).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: any): void {}

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Filter]: this._builder.control(''),
      [Controls.Tags]: this._builder.control(this.tags, this.required ? [Validators.required] : null),
    });
  }

  private _initSubscriptions() {
    this.form
      .get(Controls.Filter)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .pipe(
        startWith(''),
        map((tag: string) => (tag ? this._filter(tag) : this.allTags.slice()))
      )
      .subscribe(data => {
        this.filteredTags = data;
      });
  }

  private _patchValue() {
    this.form.patchValue({
      [Controls.Filter]: '',
      [Controls.Tags]: this.selectedTags,
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue));
  }

  private _removeSelectedTagsFromList(): string[] {
    return this.allTags.filter(tag => !this.selectedTags.includes(tag));
  }
}
