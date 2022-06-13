// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {getIconClassForButton} from '@shared/utils/common';
import {Observable} from 'rxjs';

export interface ConfirmationDialogConfig {
  title: string;
  message: string;
  confirmLabel: string;
  // Following field is required only if dialog should have an warning message with an icon.
  warning?: string;
  // Following fields are required only if dialog should have an input field for verification.
  compareName?: string;
  inputPlaceholder?: string;
  inputTitle?: string;
  throttleButton?: boolean;
  observable?: Observable<any>;
  next?: void;
}

@Component({
  selector: 'km-confirmation-dialog',
  templateUrl: './template.html',
})
export class ConfirmationDialogComponent {
  inputName = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig
  ) {}

  onEnterKeyDown(): void {
    if (!this.inputNameMatches()) {
      return;
    }
    this.dialogRef.close(true);
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    if (!!this.data.compareName && this.data.compareName.length > 0) {
      return this.inputName === this.data.compareName;
    }
    return true;
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }
}
