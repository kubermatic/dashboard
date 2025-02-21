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

import {Component, Input} from '@angular/core';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {ClipboardService} from 'ngx-clipboard';
import {finalize, take} from 'rxjs/operators';

@Component({
    selector: 'km-copy-joining-script-button',
    templateUrl: './template.html',
    standalone: false
})
export class CopyJoiningScriptButtonComponent {
  private readonly COPIED_TIMEOUT = 2000;

  @Input() machineDeploymentID: string;
  @Input() clusterName: string;
  @Input() projectID: string;

  isLoading: boolean;
  isCopied: boolean;

  constructor(
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _clipboardService: ClipboardService
  ) {}

  copyJoiningScript(): void {
    this.isLoading = true;
    this._machineDeploymentService
      .getJoiningScript(this.machineDeploymentID, this.clusterName, this.projectID)
      .pipe(take(1))
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(script => {
        try {
          const decoded = atob(script);
          this._clipboardService.copy(decoded);
          this.isCopied = true;
          setTimeout(() => (this.isCopied = false), this.COPIED_TIMEOUT);
        } catch (_) {
          return;
        }
      });
  }
}
