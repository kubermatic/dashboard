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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {OPAService} from '@core/services/opa/service';
import {NotificationService} from '@core/services/notification/service';
import {ConstraintTemplate} from '@shared/entity/opa';
import {take} from 'rxjs/operators';

export interface DeleteConstraintTemplateDialogConfig {
  constraintTemplate: ConstraintTemplate;
}

@Component({
  selector: 'km-delete-constraint-template-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DeleteConstraintTemplateDialog {
  private readonly _defaultTimeout = 3000;

  constructor(
    public _matDialogRef: MatDialogRef<DeleteConstraintTemplateDialog>,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConstraintTemplateDialogConfig
  ) {}

  delete(): void {
    this._opaService
      .deleteConstraintTemplate(this.data.constraintTemplate.name)
      .pipe(take(1))
      .subscribe(_ => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The constraint template ${this.data.constraintTemplate.name} was deleted`);
        setTimeout(() => this._opaService.refreshConstraintTemplates(), this._defaultTimeout);
      });
  }
}
