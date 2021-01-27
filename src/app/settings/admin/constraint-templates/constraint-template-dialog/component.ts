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
import {OPAService} from '@core/services/opa/service';
import {NotificationService} from '@core/services/notification/service';
import {ConstraintTemplate} from '@shared/entity/opa';
import {dump, load} from 'js-yaml';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface ConstraintTemplateDialogConfig {
  title: string;
  mode: Mode;
  confirmLabel: string;

  // Constraint Template has to be specified only if dialog is used in the edit mode.
  constraintTemplate?: ConstraintTemplate;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
}

export enum Controls {
  TemplateName = 'name',
  Spec = 'spec',
}

@Component({
  selector: 'km-constraint-template-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ConstraintTemplateDialog implements OnInit, OnDestroy {
  readonly controls = Controls;
  form: FormGroup;
  spec = '';
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    public _matDialogRef: MatDialogRef<ConstraintTemplateDialog>,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: ConstraintTemplateDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(this.data.mode === Mode.Edit ? this.data.constraintTemplate.name : '', [
        Validators.required,
      ]),
    });

    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initProviderConfigEditor(): void {
    if (this.data.mode === Mode.Edit) {
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

    switch (this.data.mode) {
      case Mode.Add:
        return this._create(constraintTemplate);
      case Mode.Edit:
        return this._edit(constraintTemplate);
    }
  }

  private _create(constraintTemplate: ConstraintTemplate): void {
    this._opaService
      .createConstraintTemplate(constraintTemplate)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The constraint template ${result.name} was created`);
        this._opaService.refreshConstraintTemplates();
      });
  }

  private _edit(constraintTemplate: ConstraintTemplate): void {
    this._opaService
      .patchConstraintTemplate(this.data.constraintTemplate.name, constraintTemplate)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The constraint template ${result.name} was updated`);
        this._opaService.refreshConstraintTemplates();
      });
  }
}
