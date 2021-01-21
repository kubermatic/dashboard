// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConstraintTemplate} from '@shared/entity/opa';
import {dump, load} from 'js-yaml';
import * as _ from 'lodash';
import {Subject} from 'rxjs';

export interface ConstraintTemplateDataDialogConfig {
  title: string;
  confirmLabel: string;
  isEditing: boolean;

  // Constraint Template has to be specified only if dialog is used in the edit mode.
  constraintTemplate?: ConstraintTemplate;
}

export enum Controls {
  TemplateName = 'name',
  Spec = 'spec',
}

@Component({
  selector: 'km-add-constraint-template-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ConstraintTemplatesDataDialogComponent implements OnInit, OnDestroy {
  readonly controls = Controls;
  form: FormGroup;
  spec = '';
  private _unsubscribe = new Subject<void>();

  constructor(
    public _matDialogRef: MatDialogRef<ConstraintTemplatesDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConstraintTemplateDataDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(this.data.isEditing ? this.data.constraintTemplate.name : '', [Validators.required]),
    });

    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initProviderConfigEditor(): void {
    if (this.data.isEditing) {
      const spec = this.data.constraintTemplate.spec;
      if (!_.isEmpty(spec)) {
        this.spec = dump(spec);
      }
    }
  }

  private _getSpec(): any {
    const raw = load(this.spec);
    return !_.isEmpty(raw) ? raw : {};
  }

  save(): void {
    const constraintTemplate: ConstraintTemplate = {
      name: this.form.controls.name.value,
      spec: this._getSpec(),
    };

    this._matDialogRef.close(constraintTemplate);
  }
}
