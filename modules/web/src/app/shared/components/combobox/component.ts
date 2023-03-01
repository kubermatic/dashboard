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

import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {MatLegacySelect as MatSelect} from '@angular/material/legacy-select';
import {distinctUntilChanged, skipWhile, takeUntil} from 'rxjs/operators';
import {BaseFormValidator} from '../../validators/base-form.validator';
import {OptionDirective} from './directive';

export enum ComboboxControls {
  Select = 'select',
}

@Component({
  selector: 'km-combobox',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilteredComboboxComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FilteredComboboxComponent),
      multi: true,
    },
  ],
})
export class FilteredComboboxComponent extends BaseFormValidator implements OnInit, OnDestroy, OnChanges {
  @Input() label: string;
  @Input() inputLabel: string;
  @Input() required = false;
  @Input() grouped = false;
  @Input() isDisabled = false;
  @Input() groups: string[] = [];
  @Input() options: object[] = [];
  @Input() filterBy: string;
  @Input() selectBy: string;
  @Input('optionsGetter') getOptions: (group: string) => object[];
  @Input() selected: string | string[] = '';
  @Input() hint: string;
  @Input() valueFormatter: (selected: string | string[]) => string;
  @Input() multiple = false;
  @Input() customId = undefined;

  @Output() changed = new EventEmitter<string | string[]>();
  @ContentChild(OptionDirective, {read: TemplateRef}) optionTemplate;
  filterByInput: object = {};
  readonly controls = ComboboxControls;
  @ViewChild('input', {static: true}) private readonly _inputEl: ElementRef;
  @ViewChild('select', {static: true}) private readonly _matSelect: MatSelect;

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [ComboboxControls.Select]: this._builder.control('', this.required ? Validators.required : []),
    });

    this._updateFormState();

    if (!this.selectBy) {
      this.selectBy = this.filterBy;
    }

    this.form
      .get(ComboboxControls.Select)
      .valueChanges.pipe(skipWhile(value => !value))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.changed.emit(this.form.get(ComboboxControls.Select).value));
  }

  private _updateFormState(): void {
    if (!this.form) {
      return;
    }

    this.form.get(ComboboxControls.Select).setValue(this.selected);

    if (this.isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }

    this.form.updateValueAndValidity();
  }

  onOpen(opened: boolean): void {
    if (!opened) {
      this._inputEl.nativeElement.value = '';
      this.filterByInput[this.filterBy] = '';
    }
  }

  formatMultiple(value: string | string[]): string {
    return value?.length ? (value as string[]).join(', ') : '';
  }

  reset(): void {
    this.selected = null;
    this.form.get(ComboboxControls.Select).setValue(this.selected);
    this.changed.emit(this.selected);
  }

  hasOptions(): boolean {
    return this._matSelect && this._matSelect.options && this._matSelect.options.length > 0;
  }

  ngOnChanges(): void {
    this._updateFormState();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  writeValue(value: string | string[]) {
    this.form.get(ComboboxControls.Select).setValue(value, {emitEvent: false});
    this.selected = value;
  }
}
