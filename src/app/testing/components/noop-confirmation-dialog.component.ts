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

import {Component, NgModule} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {DeleteProjectConfirmationComponent} from '../../project/delete-project/delete-project.component';
import {SharedModule} from '../../shared/shared.module';

// NoopConfirmDialogComponent is only a workaround to trigger change detection
@Component({template: ''})
export class NoopConfirmDialogComponent {}

@NgModule({
  imports: [MatDialogModule, NoopAnimationsModule, SharedModule],
  exports: [NoopConfirmDialogComponent],
  declarations: [NoopConfirmDialogComponent, DeleteProjectConfirmationComponent],
  entryComponents: [ConfirmationDialogComponent, DeleteProjectConfirmationComponent],
})
export class DialogTestModule {}
