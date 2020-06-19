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
