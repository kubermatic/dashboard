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

import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Project} from '@shared/entity/project';

@Component({
  selector: 'km-delete-project',
  templateUrl: './template.html',
})
export class DeleteProjectConfirmationComponent {
  @Input() project: Project;
  verificationInput = '';

  constructor(public dialogRef: MatDialogRef<DeleteProjectConfirmationComponent>) {}

  onEnterKeyDown(): void {
    if (!this.isNameVerified()) {
      return;
    }
    this.dialogRef.close(true);
  }

  isNameVerified(): boolean {
    return this.verificationInput === this.project.name;
  }
}
