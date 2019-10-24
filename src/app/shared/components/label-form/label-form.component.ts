import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {SlideInOut} from '../../animations/slideinout';
import {LabelFormValidators} from '../../validators/label-form.validators';

@Component({
  selector: 'km-label-form',
  templateUrl: './label-form.component.html',
  styleUrls: ['./label-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LabelFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => LabelFormComponent),
      multi: true,
    }
  ],
  animations: [SlideInOut]
})
export class LabelFormComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  @Input() title = 'Labels';
  @Input() labels: object;
  @Output() labelsChange = new EventEmitter<object>();
  labelsForm: FormGroup;
  initialLabels: object;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _formBuilder: FormBuilder) {}

  get labelArray(): FormArray {
    return this.labelsForm.get('labels') as FormArray;
  }

  static filterNullifiedKeys(labels: object): object {
    const filteredLabelsObject = {};
    if (labels instanceof Object) {
      Object.keys(labels).forEach(key => {
        // Do not allow nullified (marked for removal) labels.
        if (labels[key] !== null) {
          filteredLabelsObject[key] = labels[key];
        }
      });
    }
    return filteredLabelsObject;
  }

  private static _isFilled(label: AbstractControl): boolean {
    return label.get('key').value.length !== 0;
  }

  ngOnInit(): void {
    // Initialize labels form.
    this.labelsForm = this._formBuilder.group({labels: this._formBuilder.array([])});

    // Make sure that labels object exist.
    if (!this.labels) {
      this.labels = {};
    }

    // Save initial state of labels.
    this.initialLabels = this.labels;

    // Setup labels form with label data.
    Object.keys(this.labels).forEach(key => {
      this._addLabel(key, this.labels[key]);
    });

    // Add initial label for the user.
    this._addLabel();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.labelsForm.setValue(obj, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.labelsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.labelsForm.disable() : this.labelsForm.enable();
  }

  validate(control: AbstractControl): ValidationErrors|null {
    return this.labelsForm.valid ? null : {invalidForm: {valid: false, message: 'Labels are invalid.'}};
  }

  isRemovable(index: number): boolean {
    return index < this.labelArray.length - 1;
  }

  deleteLabel(index: number): void {
    this.labelArray.removeAt(index);
    this._updateLabelsObject();
  }

  check(index: number): void {
    this._addLabelIfNeeded();
    this._validateKey(index);
    this._updateLabelsObject();
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.labelArray.at(this.labelArray.length - 1);
    if (LabelFormComponent._isFilled(lastLabel)) {
      this._addLabel();
    }
  }

  private _addLabel(key = '', value = ''): void {
    this.labelArray.push(this._formBuilder.group({
      key: [
        {value: key, disabled: false}, Validators.compose([
          LabelFormValidators.labelKeyNameLength,
          LabelFormValidators.labelKeyPrefixLength,
          LabelFormValidators.labelKeyNamePattern,
          LabelFormValidators.labelKeyPrefixPattern,
        ])
      ],
      value: [
        {value, disabled: false}, Validators.compose([
          LabelFormValidators.labelValueLength,
          LabelFormValidators.labelValuePattern,
        ])
      ],
    }));
  }

  private _validateKey(index: number): void {
    const elem = this.labelArray.at(index).get('key');

    if (this._isKeyDuplicated(index)) {
      elem.setErrors({validLabelKeyUniqueness: true});
    }

    this.labelsForm.updateValueAndValidity();
  }

  private _isKeyDuplicated(index: number): boolean {
    let duplications = 0;
    const currentKey = this.labelArray.at(index).get('key').value;
    for (let i = 0; i < this.labelArray.length; i++) {
      const key = this.labelArray.at(i).get('key').value;
      if (key.length !== 0 && key === currentKey) {
        duplications++;
      }
      if (duplications > 1) {
        return true;
      }
    }
    return false;
  }

  private _updateLabelsObject(): void {
    // Create a new labels object.
    const labelsObject = {};

    // Fill it with current labels data.
    this.labelArray.getRawValue().forEach(kv => {
      if (kv.key.length !== 0) {
        labelsObject[kv.key] = kv.value;
      }
    });

    // Nullify initial labels data (it is needed to make edit work as it uses JSON Merge Patch).
    Object.keys(this.initialLabels).forEach(initialKey => {
      if (!labelsObject.hasOwnProperty(initialKey)) {
        labelsObject[initialKey] = null;
      }
    });

    // Update labels object.
    this.labels = labelsObject;

    // Emit the change event.
    this.labelsChange.emit(this.labels);
  }
}
