// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterRestore} from '@app/shared/entity/backup';

@Component({
  selector: 'km-delete-restore-dialog',
  templateUrl: './template.html',
})
export class DeleteRestoreDialogComponent implements OnInit {
  verificationInput = '';
  restores: ClusterRestore[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: DeleteRestoreDialogComponent,
    private readonly _dialogRef: MatDialogRef<DeleteRestoreDialogComponent>
  ) {}

  ngOnInit(): void {
    this.restores = this._config.restores;
  }

  onEnterKeyDown(): void {
    if (!this.isNameVerified()) {
      return;
    }
    this._dialogRef.close(true);
  }

  isNameVerified(): boolean {
    if (this.restores.length > 1) {
      return this.verificationInput === 'yes';
    }
    return this.verificationInput === this.restores[0].name;
  }
}
