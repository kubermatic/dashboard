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
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {OPAService} from '@core/services/opa';
import {NotificationService} from '@core/services/notification';
import {Constraint, ConstraintTemplate, ConstraintSpec} from '@shared/entity/opa';
import {dump, load} from 'js-yaml';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

export interface DefaultConstraintDialogConfig {
  title: string;
  mode: Mode;
  confirmLabel: string;

  // Default Constraint has to be specified only if dialog is used in the edit mode.
  defaultConstraint?: Constraint;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
}

export enum Controls {
  Name = 'name',
  ConstraintTemplate = 'constraintTemplate',
  Spec = 'spec',
}

@Component({
  selector: 'km-default-constraint-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DefaultConstraintDialog implements OnInit, OnDestroy {
  readonly Controls = Controls;
  form: FormGroup;
  spec = '';
  constraintTemplates: ConstraintTemplate[] = [];
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<DefaultConstraintDialog>,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DefaultConstraintDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this.data.mode === Mode.Edit ? this.data.defaultConstraint.name : '', [
        Validators.required,
      ]),
      [Controls.ConstraintTemplate]: this._builder.control(
        this.data.mode === Mode.Edit ? this.data.defaultConstraint.spec.constraintType : '',
        [Validators.required]
      ),
    });

    this._initConstraintSpecEditor();

    this._opaService.constraintTemplates
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        constraintTemplates => (this.constraintTemplates = _.sortBy(constraintTemplates, ct => ct.name.toLowerCase()))
      );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {
    const defaultConstraint: Constraint = {
      name: this.form.get(Controls.Name).value,
      spec: this._getSpec(),
    };

    switch (this.data.mode) {
      case Mode.Add:
        return this._create(defaultConstraint);
      case Mode.Edit:
        return this._edit(defaultConstraint);
    }
  }

  private _create(defaultConstraint: Constraint): void {
    this._opaService
      .createDefaultConstraint(defaultConstraint)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The default constraint ${result.name} was created`);
        this._opaService.refreshConstraint();
      });
  }

  private _edit(defaultConstraint: Constraint): void {
    this._opaService
      .patchDefaultConstraint(this.data.defaultConstraint.name, defaultConstraint)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The default constraint ${result.name} was updated`);
        this._opaService.refreshConstraint();
      });
  }

  private _initConstraintSpecEditor(): void {
    if (this.data.mode === Mode.Edit) {
      const spec = this.data.defaultConstraint.spec;
      if (!_.isEmpty(spec)) {
        this.spec = dump(spec);
      }
    }
  }

  private _getSpec(): ConstraintSpec {
    let spec = new ConstraintSpec();
    const raw = load(this.spec) as ConstraintSpec;
    if (!_.isEmpty(raw)) {
      spec = raw;
    }
    spec.constraintType = this.form.get(Controls.ConstraintTemplate).value;
    return spec;
  }
}
