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

import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {KubeVirtTopologySpreadConstraint, KubeVirtTopologyWhenUnsatisfiable} from '@shared/entity/provider/kubevirt';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Constraints = 'constraints',
  MaxSkew = 'maxSkew',
  TopologyKey = 'topologyKey',
  WhenUnsatisfiable = 'whenUnsatisfiable',
}

@Component({
  selector: 'km-topology-spread-constraint-form',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TopologySpreadConstraintFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TopologySpreadConstraintFormComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class TopologySpreadConstraintFormComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly minimumMaxSkew = 1;

  @Input() constraints: KubeVirtTopologySpreadConstraint[];
  @Output() constraintsChange = new EventEmitter<KubeVirtTopologySpreadConstraint[]>();

  form: FormGroup;
  whenUnsatisfiableOptions = Object.keys(KubeVirtTopologyWhenUnsatisfiable);
  initialConstraint: KubeVirtTopologySpreadConstraint[];
  removedConstraints: KubeVirtTopologySpreadConstraint[] = [];
  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _dialogModeService: DialogModeService
  ) {
    super();
  }

  get constraintArray(): FormArray {
    return this.form.get(Controls.Constraints) as FormArray;
  }

  static filterNullifiedConstraints(
    constraints: KubeVirtTopologySpreadConstraint[]
  ): KubeVirtTopologySpreadConstraint[] {
    const filteredConstraints = [];
    if (constraints && Array.isArray(constraints)) {
      constraints.forEach(constraint => {
        if (constraint.maxSkew && constraint.topologyKey && constraint.whenUnsatisfiable) {
          filteredConstraints.push(constraint);
        }
      });
    }
    return filteredConstraints;
  }

  ngOnInit(): void {
    this.form = this._formBuilder.group({[Controls.Constraints]: this._formBuilder.array([])});

    if (!this.constraints) {
      this.constraints = [];
    }

    // Setup constraints form with constraint data.
    this.constraints.forEach(constraint => {
      this._addConstraint(constraint);
    });

    // Add initial constraint for the user.
    this._addConstraint();

    this.initialConstraint = this.constraints;

    this.form.valueChanges.subscribe(value => {
      this.removedConstraints = this.removedConstraints?.filter(
        removedConstraint =>
          !value.constraints?.some(constraint => removedConstraint?.topologyKey === constraint?.topologyKey)
      );
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onControlValueChange(constraintControl: AbstractControl): void {
    this._addConstraintIfNeeded();
    this._validateKey(constraintControl);
    this._updateConstraints();
  }

  isRemovable(index: number): boolean {
    return index < this.constraintArray.length - 1;
  }

  deleteConstraint(index: number): void {
    if (this._dialogModeService.isEditDialog) {
      this.removedConstraints?.push(this.constraints[index]);
    }

    this.constraintArray.removeAt(index);
    this._updateConstraints();
  }

  isConstraintsChanged(index: number): boolean {
    const [maxSkew, topologyKey, whenUnsatisfiable] = [
      this.constraints[index]?.maxSkew,
      this.constraints[index]?.topologyKey,
      this.constraints[index]?.whenUnsatisfiable,
    ];
    const [initialMaxSkew, initialTopologyKey, initialWhenUnsatisfiable] = [
      this.initialConstraint[index]?.maxSkew,
      this.initialConstraint[index]?.topologyKey,
      this.initialConstraint[index]?.whenUnsatisfiable,
    ];
    if (maxSkew && topologyKey && whenUnsatisfiable) {
      return (
        (maxSkew !== initialMaxSkew ||
          topologyKey !== initialTopologyKey ||
          whenUnsatisfiable !== initialWhenUnsatisfiable) &&
        this._dialogModeService.isEditDialog
      );
    }
    return false;
  }

  private static _isFilled(constraint: AbstractControl): boolean {
    return (
      _.isInteger(constraint.get(Controls.MaxSkew).value) &&
      constraint.get(Controls.TopologyKey).value &&
      constraint.get(Controls.WhenUnsatisfiable).value
    );
  }

  private _addConstraintIfNeeded(): void {
    const lastLabel = this.constraintArray.at(this.constraintArray.length - 1);
    if (TopologySpreadConstraintFormComponent._isFilled(lastLabel)) {
      this._addConstraint();
    }
  }

  private _addConstraint(constraint: KubeVirtTopologySpreadConstraint = null): void {
    this.constraintArray.controls.forEach(control =>
      control.get(Controls.TopologyKey).setValidators(Validators.required)
    );
    this.form.updateValueAndValidity({emitEvent: false});

    const maxSkewControl = this._formBuilder.control(
      constraint?.maxSkew || this.minimumMaxSkew,
      Validators.min(this.minimumMaxSkew)
    );
    const constraintControl = this._formBuilder.group({
      [Controls.MaxSkew]: maxSkewControl,
      [Controls.TopologyKey]: this._formBuilder.control(constraint?.topologyKey || ''),
      [Controls.WhenUnsatisfiable]: this._formBuilder.control(constraint?.whenUnsatisfiable || ''),
    });
    this.constraintArray.push(constraintControl);
    maxSkewControl.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.onControlValueChange(constraintControl));
  }

  private _validateKey(constraintControl: AbstractControl): void {
    const keyControl = constraintControl.get(Controls.TopologyKey);

    if (this._isKeyDuplicated(keyControl.value)) {
      keyControl.setErrors({validLabelKeyUniqueness: true});
    }

    this.form.updateValueAndValidity();
  }

  private _isKeyDuplicated(key: string): boolean {
    if (!key) {
      return false;
    }
    return this.constraintArray.controls.filter(control => control.get(Controls.TopologyKey).value === key).length > 1;
  }

  private _updateConstraints(): void {
    this.constraints = TopologySpreadConstraintFormComponent.filterNullifiedConstraints(
      this.constraintArray.getRawValue()
    );
    this.constraintsChange.emit(this.constraints);
  }
}
