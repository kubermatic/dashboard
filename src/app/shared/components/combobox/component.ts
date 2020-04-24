import {Component, ContentChild, ElementRef, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {MatSelect} from '@angular/material/select';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
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
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FilteredComboboxComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => FilteredComboboxComponent), multi: true}
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
  @Input('optionsGetter') getOptions: (group: string) => object[];
  @Input() selected: string;
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

    this.form.get(Controls.Select)
        .valueChanges.pipe(distinctUntilChanged())
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
