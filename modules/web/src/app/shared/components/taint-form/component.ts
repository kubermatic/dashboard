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

import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {Taint} from '../../entity/node';
import {LabelFormValidators} from '../../validators/label-form.validators';
import {TaintFormValidators} from '../../validators/taint-form.validators';
import {DialogModeService} from '@app/core/services/dialog-mode';

@Component({
    selector: 'km-taint-form',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TaintFormComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TaintFormComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class TaintFormComponent implements OnInit {
  @Input() title = 'Taints';
  @Input() taints: Taint[];
  @Output() taintsChange = new EventEmitter<Taint[]>();
  form: FormGroup;
  removedTaints: Taint[] = [];
  initialTaints: Taint[];
  availableEffects = Taint.getAvailableEffects();

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _dialogModeService: DialogModeService
  ) {}

  get taintArray(): FormArray {
    return this.form.get('taints') as FormArray;
  }

  static filterNullifiedTaints(taints: Taint[]): Taint[] {
    const filteredTaints = [];
    if (taints instanceof Object) {
      taints.forEach(taint => {
        if (taint.key && taint.value && taint.effect) {
          filteredTaints.push(taint);
        }
      });
    }
    return filteredTaints;
  }

  ngOnInit(): void {
    // Initialize taints form.
    this.form = this._formBuilder.group({taints: this._formBuilder.array([])});

    // Make sure that taints array exist.
    if (!this.taints) {
      this.taints = [];
    }

    // Setup taints form with taint data.
    this.taints.forEach(taint => {
      this._addTaint(taint);
    });

    // Add initial taint for the user.
    this._addTaint();
    this.initialTaints = this.taints;

    this.form.valueChanges.subscribe(value => {
      this.removedTaints = this.removedTaints.filter(
        removedtaint => !value.taints.some(taint => removedtaint?.key === taint?.key)
      );
    });
  }

  deleteTaint(index: number): void {
    if (this._dialogModeService.isEditDialog) {
      this.removedTaints?.push(this.taints[index]);
    }
    this.taintArray.removeAt(index);
    this._updateTaints();
  }

  isRemovable(index: number): boolean {
    return index < this.taintArray.length - 1;
  }

  check(index: number): void {
    this._addTaintIfNeeded();
    this._validateKey(index);
    this._updateTaints();
  }

  isTaintChanged(index: number): boolean {
    if (this.taints[index]?.key) {
      return (
        (this.taints[index]?.key !== this.initialTaints[index]?.key ||
          this.taints[index]?.value !== this.initialTaints[index]?.value ||
          this.taints[index]?.effect !== this.initialTaints[index]?.effect) &&
        this._dialogModeService.isEditDialog
      );
    }
    return false;
  }

  private _addTaintIfNeeded(): void {
    const lastLabel = this.taintArray.at(this.taintArray.length - 1);
    if (TaintFormComponent._isFilled(lastLabel)) {
      this._addTaint();
    }
  }

  private static _isFilled(taint: AbstractControl): boolean {
    return (
      taint.get('key').value.length !== 0 &&
      taint.get('value').value.length !== 0 &&
      taint.get('effect').value.length !== 0
    );
  }

  private _addTaint(taint: Taint = null): void {
    this.taintArray.push(
      this._formBuilder.group({
        key: [
          {value: taint ? taint.key : '', disabled: false},
          Validators.compose([
            LabelFormValidators.labelKeyNameLength,
            LabelFormValidators.labelKeyPrefixLength,
            LabelFormValidators.labelKeyNamePattern,
            LabelFormValidators.labelKeyPrefixPattern,
          ]),
        ],
        value: [
          {value: taint ? taint.value : '', disabled: false},
          Validators.compose([TaintFormValidators.taintValueLength, LabelFormValidators.labelValuePattern]),
        ],
        effect: [
          {value: taint ? taint.effect : '', disabled: false},
          Validators.compose([TaintFormValidators.taintValidEffect]),
        ],
      })
    );
  }

  private _validateKey(index: number): void {
    const elem = this.taintArray.at(index).get('key');

    if (this._isKeyDuplicated(index)) {
      elem.setErrors({validLabelKeyUniqueness: true});
    }

    this.form.updateValueAndValidity();
  }

  private _isKeyDuplicated(index: number): boolean {
    let duplications = 0;
    const currentKey = this.taintArray.at(index).get('key').value;
    for (let i = 0; i < this.taintArray.length; i++) {
      const key = this.taintArray.at(i).get('key').value;
      if (key.length !== 0 && key === currentKey) {
        duplications++;
      }
      if (duplications > 1) {
        return true;
      }
    }
    return false;
  }

  private _updateTaints(): void {
    this.taints = TaintFormComponent.filterNullifiedTaints(this.taintArray.getRawValue());

    // Emit the change event.
    this.taintsChange.emit(this.taints);
  }
}
