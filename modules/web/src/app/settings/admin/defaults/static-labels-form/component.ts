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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ResourceType} from '@app/shared/entity/common';
import {StaticLabel} from '@app/shared/entity/settings';
import {AsyncValidators} from '@app/shared/validators/async.validators';
import {LabelFormValidators} from '@app/shared/validators/label-form.validators';
import {Subject, takeUntil} from 'rxjs';

enum Controls {
  StaticLabels = 'staticLabels',
  Key = 'key',
  Values = 'values',
  Protected = 'protected',
  Default = 'default',
}

@Component({
  selector: 'km-static-labels-form',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class StaticLabelsFormComponent implements OnInit, OnChanges, OnDestroy {
  private _unsubscribe = new Subject<void>();
  readonly Controls = Controls;

  form: FormGroup;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  @Input() staticLabels: StaticLabel[] = [];
  @Output() staticLabelsChange = new EventEmitter<StaticLabel[]>();

  get staticLabelArray(): FormArray {
    return this.form.get(Controls.StaticLabels) as FormArray;
  }

  constructor(private readonly _formBuilder: FormBuilder) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form) {
      this._initForm();
      this._addStaticLabel();
      this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
        this._updateLabelsObject();
        this._addLabelIfNeeded();
      });
    }

    // Add the initial static label and remove the empty label that was added when initializing the form.
    if (changes.staticLabels?.currentValue && !changes.staticLabels?.previousValue) {
      this.staticLabelArray.controls.pop();
      this.staticLabels?.forEach(label => {
        this._addStaticLabel(label);
      });
      this._addStaticLabel();
      this._updateLabelsObject();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  deleteLabel(index: number): void {
    this.staticLabelArray.removeAt(index);
    this._updateLabelsObject();
  }

  isKeyUnique(index: number): void {
    let duplications = 0;
    const key = this.staticLabelArray.at(index).get(Controls.Key);

    this.staticLabelArray.getRawValue().forEach((label: StaticLabel) => {
      if (label.key === key.value) {
        duplications++;
      }
    });

    if (duplications > 1) {
      key.setErrors({validLabelKeyUniqueness: true});
    }
  }

  onProtectedValueChange(val: boolean, index: number): boolean {
    const defaultControl = this.staticLabelArray.at(index).get(Controls.Default);
    if (val) {
      defaultControl.setValue(true);
      defaultControl.disable();
    } else {
      defaultControl.enable();
    }
    return val;
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.staticLabelArray.at(this.staticLabelArray.length - 1)?.value;
    if (lastLabel?.key && lastLabel?.values?.tags?.length) {
      this._addStaticLabel();
    }
  }

  private _initForm(): void {
    this.form = this._formBuilder.group({
      [Controls.StaticLabels]: this._formBuilder.array([]),
    });
  }

  private _addStaticLabel(label?: StaticLabel): void {
    const staticLabel = this._formBuilder.group({
      [Controls.Key]: [
        label?.key || '',
        Validators.compose([
          LabelFormValidators.labelKeyNameLength,
          LabelFormValidators.labelKeyPrefixLength,
          LabelFormValidators.labelKeyNamePattern,
          LabelFormValidators.labelKeyPrefixPattern,
        ]),
        Validators.composeAsync(this.asyncLabelValidators),
      ],
      [Controls.Values]: [label?.values || []],
      [Controls.Protected]: [label?.protected || false],
      [Controls.Default]: [{value: label?.protected || label?.default || false, disabled: label?.protected}],
    });

    this.staticLabelArray.push(staticLabel);
  }

  private _updateLabelsObject(): void {
    let err = false;
    const labels: StaticLabel[] = this.staticLabelArray
      .getRawValue()
      .filter((raw, i) => {
        this.isKeyUnique(i);
        if (
          !!this.staticLabelArray.controls[i].get(Controls.Key).errors ||
          !!this.staticLabelArray.controls[i].get(Controls.Values).errors
        ) {
          err = true;
        }
        return raw.key;
      })
      .map(raw => {
        return {
          key: raw.key,
          values: raw.values.length ? raw.values : raw.values?.tags,
          protected: raw.protected,
          default: raw.default,
        };
      });

    if (!err) {
      this.staticLabelsChange.emit(labels);
    }
  }
}
