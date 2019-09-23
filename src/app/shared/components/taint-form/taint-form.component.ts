import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {SlideInOut} from '../../animations/slideinout';
import {Taint} from '../../entity/NodeEntity';
import {LabelFormValidators} from '../../validators/label-form.validators';
import {TaintFormValidators} from '../../validators/taint-form.validators';

@Component({
  selector: 'km-taint-form',
  templateUrl: './taint-form.component.html',
  styleUrls: ['./taint-form.component.scss'],
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
    }
  ],
  animations: [SlideInOut]
})
export class TaintFormComponent implements OnInit {
  @Input() title = 'Taints';
  @Input() taints: Taint[];
  @Output() taintsChange = new EventEmitter<object>();
  taintsForm: FormGroup;
  availableEffects = Taint.getAvailableEffects();

  constructor(private readonly _formBuilder: FormBuilder) {}

  get taintArray(): FormArray {
    return this.taintsForm.get('taints') as FormArray;
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
    this.taintsForm = this._formBuilder.group({taints: this._formBuilder.array([])});

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
  }

  deleteTaint(index: number): void {
    this.taintArray.removeAt(index);
    this._updateTaints();
  }

  isRemovable(): boolean {
    return this.taintArray.length > 1;
  }

  check(index: number): void {
    this._addTaintIfNeeded();
    this._validateKey(index);
    this._updateTaints();
  }

  private _addTaintIfNeeded(): void {
    const lastLabel = this.taintArray.at(this.taintArray.length - 1);
    if (TaintFormComponent._isFilled(lastLabel)) {
      this._addTaint();
    }
  }

  private static _isFilled(taint: AbstractControl): boolean {
    return taint.get('key').value.length !== 0 && taint.get('value').value.length !== 0 &&
        taint.get('effect').value.length !== 0;
  }

  private _addTaint(taint: Taint = null): void {
    this.taintArray.push(this._formBuilder.group({
      key: [
        {value: taint ? taint.key : '', disabled: false}, Validators.compose([
          LabelFormValidators.labelKeyNameLength,
          LabelFormValidators.labelKeyPrefixLength,
          LabelFormValidators.labelKeyNamePattern,
          LabelFormValidators.labelKeyPrefixPattern,
        ])
      ],
      value: [
        {value: taint ? taint.value : '', disabled: false}, Validators.compose([
          Validators.required,
          TaintFormValidators.taintValueLength,
          LabelFormValidators.labelValuePattern,
        ])
      ],
      effect: [
        {value: taint ? taint.effect : '', disabled: false},
        Validators.compose([
          TaintFormValidators.taintValidEffect,
        ]),
      ],
    }));
  }

  private _validateKey(index: number): void {
    const elem = this.taintArray.at(index).get('key');

    if (this._isKeyDuplicated(index)) {
      elem.setErrors({validLabelKeyUniqueness: true});
    }

    this.taintsForm.updateValueAndValidity();
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
