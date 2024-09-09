// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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

import {Component, DoCheck, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {SettingsService} from '@core/services/settings';
import _ from 'lodash';
import {Observable, of, Subject, takeUntil} from 'rxjs';
import {LabelFormValidators} from '../../validators/label-form.validators';

@Component({
  selector: 'km-annotation-form',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AnnotationFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AnnotationFormComponent),
      multi: true,
    },
  ],
})
export class AnnotationFormComponent implements OnInit, ControlValueAccessor, AsyncValidator, DoCheck, OnDestroy {
  @Input() title = 'Annotations';
  @Input() annotations: Record<string, string> = {};
  @Output() annotationsChange = new EventEmitter<Record<string, string>>();

  form: FormGroup;
  protectedAnnotations: Set<string> = new Set();
  hiddenAnnotations: Set<string> = new Set();
  removedAnnotations: {key: string; value: string}[] = [];
  initialAnnotations: Record<string, string>;

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _settingsService: SettingsService,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    if (!this.annotations) {
      this.annotations = {};
    }

    this.initializeAnnotationSets();
    this.initForm();
    this.initialAnnotations = {...this.annotations};

    this.form.valueChanges.subscribe(value => {
      this.removedAnnotations = this.removedAnnotations.filter(
        removedAnnotation => !value.annotations.some(annotation => removedAnnotation.key === annotation.key)
      );
    });
  }

  ngDoCheck(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onTouched(): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  validate(_: AbstractControl): Observable<ValidationErrors | null> {
    return of(this.form.valid ? null : {invalid: true});
  }

  get annotationsArray(): FormArray {
    return this.form.get('annotations') as FormArray;
  }

  private async initializeAnnotationSets(): Promise<void> {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.protectedAnnotations = new Set(settings.annotations?.protectedAnnotations || []);
      this.hiddenAnnotations = new Set(settings.annotations?.hiddenAnnotations || []);
    });
  }

  private initForm(): void {
    this.form = this._formBuilder.group({
      annotations: this._formBuilder.array([]),
    });

    if (!_.isEmpty(this.annotations)) {
      Object.entries(this.annotations).forEach(([key, value]) => {
        if (!this.hiddenAnnotations.has(key)) {
          this.addAnnotation(key, value, this.protectedAnnotations.has(key));
        }
      });
    }

    this.addAnnotation();
  }

  addAnnotation(key: string = '', value: string = '', isProtected: boolean = false): void {
    this.annotationsArray.push(
      this._formBuilder.group({
        key: [
          {value: key, disabled: isProtected},
          Validators.compose([
            LabelFormValidators.labelKeyNameLength,
            LabelFormValidators.labelKeyPrefixLength,
            LabelFormValidators.labelKeyNamePattern,
            LabelFormValidators.labelKeyPrefixPattern,
            this.keyValidator.bind(this),
          ]),
        ],
        value: [{value: value, disabled: isProtected}, Validators.compose([LabelFormValidators.labelValuePattern])],
        protected: [isProtected],
      })
    );
  }

  deleteAnnotation(index: number): void {
    if (this._dialogModeService.isEditDialog) {
      const annotation = this.annotationsArray.at(index);
      this.removedAnnotations.push({
        key: annotation.get('key').value,
        value: annotation.get('value').value,
      });
    }
    this.annotationsArray.removeAt(index);
    this.updateAnnotations();
  }

  isRemovable(index: number): boolean {
    return index < this.annotationsArray.length - 1 && !this.annotationsArray.at(index).get('protected').value;
  }

  check(index: number): void {
    this.addAnnotationIfNeeded();
    this.validateKey(index);
    this.updateAnnotations();
  }

  isAnnotationChanged(index: number): boolean {
    const annotation = this.annotationsArray.at(index);
    const key = annotation.get('key').value;
    if (key) {
      return this.annotations[key] !== annotation.get('value').value && this._dialogModeService.isEditDialog;
    }
    return false;
  }

  private addAnnotationIfNeeded(): void {
    const lastAnnotation = this.annotationsArray.at(this.annotationsArray.length - 1);
    if (this.isFilled(lastAnnotation)) {
      this.addAnnotation();
    }
  }

  private isFilled(annotation: AbstractControl): boolean {
    return annotation.get('key').value.length !== 0 && annotation.get('value').value.length !== 0;
  }

  private validateKey(index: number): void {
    const elem = this.annotationsArray.at(index).get('key');

    if (this.isKeyDuplicated(index)) {
      elem.setErrors({...elem.errors, validLabelKeyUniqueness: true});
    }

    this.form.updateValueAndValidity();
  }

  private isKeyDuplicated(index: number): boolean {
    let duplications = 0;
    const currentKey = this.annotationsArray.at(index).get('key').value;
    for (let i = 0; i < this.annotationsArray.length; i++) {
      const key = this.annotationsArray.at(i).get('key').value;
      if (key.length !== 0 && key === currentKey) {
        duplications++;
      }
      if (duplications > 1) {
        return true;
      }
    }
    return false;
  }

  private updateAnnotations(): void {
    const updatedAnnotations: Record<string, string> = {};
    this.annotationsArray.controls.forEach(control => {
      const key = control.get('key').value;
      const value = control.get('value').value;
      if (key && value) {
        updatedAnnotations[key] = value;
      }
    });
    this.annotations = updatedAnnotations;
    this.annotationsChange.emit(this.annotations);
  }

  keyValidator(control: AbstractControl): ValidationErrors | null {
    const key = control.value;
    if (this.protectedAnnotations.has(key) || this.hiddenAnnotations.has(key)) {
      return {forbiddenKey: true};
    }
    return null;
  }
}
