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

import {Component, Input} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {first} from 'rxjs/operators';

import {AddonConfig, getAddonLogoData, getAddonShortDescription, hasAddonLogoData} from '../../../entity/addon';
import {InstallAddonDialogComponent} from '../install-addon-dialog/install-addon-dialog.component';

@Component({
  selector: 'km-select-addon-dialog',
  templateUrl: './select-addon-dialog.component.html',
  styleUrls: ['./select-addon-dialog.component.scss'],
})
export class SelectAddonDialogComponent {
  @Input() installableAddons: string[] = [];
  @Input() addonConfigs = new Map<string, AddonConfig>();

  constructor(
    public dialogRef: MatDialogRef<SelectAddonDialogComponent>,
    private readonly _matDialog: MatDialog,
    private readonly _domSanitizer: DomSanitizer
  ) {}

  hasLogo(name: string): boolean {
    return hasAddonLogoData(this.addonConfigs.get(name));
  }

  getAddonLogo(name: string): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(getAddonLogoData(this.addonConfigs.get(name)));
  }

  getAddonShortDescription(name: string): string {
    return getAddonShortDescription(this.addonConfigs.get(name));
  }

  select(name: string): void {
    this.dialogRef.addPanelClass('km-hidden');
    const dialog = this._matDialog.open(InstallAddonDialogComponent);
    dialog.componentInstance.addonName = name;
    dialog.componentInstance.addonConfig = this.addonConfigs.get(name);
    dialog
      .afterClosed()
      .pipe(first())
      .subscribe(addedAddon => {
        this.dialogRef.close(addedAddon);
      });
  }
}
