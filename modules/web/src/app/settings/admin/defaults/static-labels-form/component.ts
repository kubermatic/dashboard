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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
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
})
export class StaticLabelsFormComponent implements OnInit, OnDestroy {
  private _unsubscribe = new Subject<void>();
  readonly Controls = Controls;

  form: FormGroup;
  @Input() staticLabels: StaticLabel[] = [];
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];
  @Output() staticLabelsChange = new EventEmitter<StaticLabel[]>();

  get statickLabelArray(): FormArray {
    return this.form.get(Controls.StaticLabels) as FormArray;
  }

  constructor(private readonly _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this._initForm();

    this.staticLabels.forEach(label => {
      this._addStaticLabel(label.key, label.values, label.protected, label.default);
    });
    this._addStaticLabel();
    this._updateLabelsObject();

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateLabelsObject();
      this._addLabelIfNeeded();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  deleteLabel(index: number): void {
    this.statickLabelArray.removeAt(index);
    this._updateLabelsObject();
  }

  isKeyUnique(index: number): void {
    let duplications = 0;
    const key = this.statickLabelArray.at(index).get('key');

    this.statickLabelArray.getRawValue().forEach((label: StaticLabel) => {
      if (label.key === key.value) {
        duplications++;
      }
    });

    if (duplications > 1) {
      key.setErrors({validLabelKeyUniqueness: true});
    }
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.statickLabelArray.at(this.statickLabelArray.length - 1)?.value;
    if (lastLabel?.key && lastLabel?.values?.tags?.length) {
      this._addStaticLabel();
    }
  }

  private _initForm(): void {
    this.form = this._formBuilder.group({
      [Controls.StaticLabels]: this._formBuilder.array([]),
    });
  }

  private _addStaticLabel(
    key: string = '',
    values: string[] = [],
    isProtected: boolean = false,
    isDefault: boolean = false
  ): void {
    const staticLabel = this._formBuilder.group({
      [Controls.Key]: [
        key,
        Validators.compose([
          LabelFormValidators.labelKeyNameLength,
          LabelFormValidators.labelKeyPrefixLength,
          LabelFormValidators.labelKeyNamePattern,
          LabelFormValidators.labelKeyPrefixPattern,
        ]),
        Validators.composeAsync(this.asyncLabelValidators),
      ],
      [Controls.Values]: [values],
      [Controls.Protected]: [isProtected],
      [Controls.Default]: [isDefault],
    });

    this.statickLabelArray.push(staticLabel);
  }

  private _updateLabelsObject(): void {
    let err = false;
    const labels: StaticLabel[] = this.statickLabelArray
      .getRawValue()
      .filter((raw, i) => {
        this.isKeyUnique(i);
        if (
          !!this.statickLabelArray.controls[i].get(Controls.Key).errors ||
          !!this.statickLabelArray.controls[i].get(Controls.Values).errors
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
