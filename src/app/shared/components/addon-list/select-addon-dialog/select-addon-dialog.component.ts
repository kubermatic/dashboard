import {Component, Input} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {first} from 'rxjs/operators';

import {AddonConfigEntity} from '../../../entity/AddonEntity';
import {InstallAddonDialogComponent} from '../install-addon-dialog/install-addon-dialog.component';

@Component({
  selector: 'km-select-addon-dialog',
  templateUrl: './select-addon-dialog.component.html',
  styleUrls: ['./select-addon-dialog.component.scss'],
})
export class SelectAddonDialogComponent {
  @Input() installableAddons: string[] = [];
  @Input() addonConfigs = new Map<string, AddonConfigEntity>();

  constructor(
      public dialogRef: MatDialogRef<SelectAddonDialogComponent>, private readonly _matDialog: MatDialog,
      private readonly _domSanitizer: DomSanitizer) {}

  hasLogo(name: string): boolean {
    const addonConfig = this.addonConfigs.get(name);
    return !!addonConfig && !!addonConfig.spec.logo;
  }

  getAddonLogo(name: string): SafeUrl {
    const addonConfig = this.addonConfigs.get(name);
    return this._domSanitizer.bypassSecurityTrustUrl(
        `data:image/${addonConfig.spec.logoFormat};base64,${addonConfig.spec.logo}`);
  }

  getAddonDescription(name: string): string {
    const addonConfig = this.addonConfigs.get(name);
    return addonConfig ? addonConfig.spec.description : '';
  }

  select(name: string): void {
    this.dialogRef.addPanelClass('km-hidden');
    const dialog = this._matDialog.open(InstallAddonDialogComponent);
    dialog.componentInstance.addonName = name;
    dialog.componentInstance.addonConfig = this.addonConfigs.get(name);
    dialog.afterClosed().pipe(first()).subscribe(addedAddon => {
      this.dialogRef.close(addedAddon);
    });
  }
}
