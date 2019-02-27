import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';

import {AbstractControl, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {LabelEntity} from './label-entity';

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
  ]
})
export class LabelFormComponent implements OnInit {
  @Input() labels: LabelEntity[];
  @Output() labelsChange = new EventEmitter<LabelEntity[]>();
  labelsForm: FormGroup;

  constructor(private readonly _formBuilder: FormBuilder) {}

  get labelArray(): FormArray {
    return this.labelsForm.get('labels') as FormArray;
  }

  private static _isFilled(label: AbstractControl): boolean {
    return label.get('key').value.length !== 0 && label.get('value').value.length !== 0;
  }

  ngOnInit(): void {
    this.labelsForm = this._formBuilder.group({labels: this._formBuilder.array([])});

    // TODO: Add labels from input array.
    // TODO: Fix array != object mismatch.

    // Add empty field for the user.
    this._addLabel();
  }

  deleteLabel(index: number): void {
    this.labelArray.removeAt(index);
  }

  isRemovable(): boolean {
    return this.labelArray.length > 1;
  }

  check(index: number): void {
    // Add label if needed.
    const lastLabel = this.labelArray.at(this.labelArray.length - 1);
    if (LabelFormComponent._isFilled(lastLabel)) {
      this._addLabel();
    }

    // Validate key.
    this._validateKey(index);

    // Update the model.
    this.labels = this.labelArray.getRawValue();
    this.labels = this.labels.filter(label => label.key.length !== 0 && label.value.length !== 0);
    this.labelsChange.emit(this.labels);
  }

  // TODO: Add more validators to ensure Kubernetes' requirements for labels.
  private _addLabel(key = '', value = ''): void {
    this.labelArray.push(this._formBuilder.group({
      key: [{value: key, disabled: false}, Validators.compose([Validators.maxLength(63)])],
      value: [{value, disabled: false}, Validators.compose([Validators.maxLength(255)])],
    }));
  }

  private _validateKey(index: number): void {
    const elem = this.labelArray.at(index).get('key');
    const isUnique = !this._isKeyDuplicated(index);
    elem.setErrors(isUnique ? null : {unique: true});
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
}
