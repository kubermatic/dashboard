import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';

import {AbstractControl, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {SlideInOut} from '../../animations/slideinout';
import {LabelFormValidators} from './label-form.validators';

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
export class LabelFormComponent implements OnInit {
  @Input() labels: object;
  @Output() labelsChange = new EventEmitter<object>();
  labelsForm: FormGroup;
  initialLabels: object;
  isVisible = true;

  constructor(private readonly _formBuilder: FormBuilder) {}

  get labelArray(): FormArray {
    return this.labelsForm.get('labels') as FormArray;
  }

  private static _isFilled(label: AbstractControl): boolean {
    return label.get('key').value.length !== 0 && label.get('value').value.length !== 0;
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

  deleteLabel(index: number): void {
    this.labelArray.removeAt(index);
    this._updateLabelsObject();
  }

  isRemovable(): boolean {
    return this.labelArray.length > 1;
  }

  check(index: number): void {
    this._addLabelIfNeeded();
    this._validateKey(index);
    this._updateLabelsObject();
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
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
      if (kv.key.length !== 0 && kv.value.length !== 0) {
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
