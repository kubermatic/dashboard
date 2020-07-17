// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
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
import {MatSelect} from '@angular/material/select';
import {distinctUntilChanged, skipWhile, takeUntil} from 'rxjs/operators';
import {BaseFormValidator} from '../../validators/base-form.validator';
import {OptionDirective} from './directive';

enum Controls {
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
  @Input() groups: string[] = [];
  @Input() options: object[] = [];
  @Input() filterBy: string;
  @Input() selectBy: string;
  @Input('optionsGetter') getOptions: (group: string) => object[];
  @Input() selected = '';
  @Input() hint: string;
  @Input() valueFormatter: (selected: string) => string;

  @Output() changed = new EventEmitter<string>();

  @ViewChild('input', {static: true}) private readonly _inputEl: ElementRef;
  @ViewChild('select', {static: true}) private readonly _matSelect: MatSelect;
  @ContentChild(OptionDirective, {read: TemplateRef}) optionTemplate;

  filterByInput: object = {};

  readonly controls = Controls;

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Select]: this._builder.control('', this.required ? Validators.required : []),
    });

    if (!this.selectBy) {
      this.selectBy = this.filterBy;
    }

    this.form
      .get(Controls.Select)
      .valueChanges.pipe(skipWhile(value => !value))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.changed.emit(this.form.get(Controls.Select).value));
  }

  onOpen(opened: boolean): void {
    if (!opened) {
      this._inputEl.nativeElement.value = '';
      this.filterByInput[this.filterBy] = '';
    }
  }

  reset(): void {
    this.selected = '';
    this.form.get(Controls.Select).setValue(this.selected);
  }

  hasOptions(): boolean {
    return this._matSelect && this._matSelect.options && this._matSelect.options.length > 0;
  }

  ngOnChanges(): void {
    if (!this.form) {
      return;
    }

    this.form.get(Controls.Select).setValue(this.selected);
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
