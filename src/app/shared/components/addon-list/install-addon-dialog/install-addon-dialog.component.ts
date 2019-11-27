import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AddonConfigEntity, AddonEntity} from '../../../entity/AddonEntity';

@Component({
  selector: 'km-install-addon-dialog',
  templateUrl: './install-addon-dialog.component.html',
  styleUrls: ['./install-addon-dialog.component.scss'],
})
export class InstallAddonDialogComponent {
  @Input() addonName: string;
  @Input() addonConfig: AddonConfigEntity;

  constructor(
      public dialogRef: MatDialogRef<InstallAddonDialogComponent>, private readonly _domSanitizer: DomSanitizer) {}

  hasLogo(): boolean {
    return !!this.addonConfig && !!this.addonConfig.spec.logo;
  }

  getAddonLogo(): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(`data:image/svg+xml;base64,${this.addonConfig.spec.logo}`);
  }

  install(): void {
    this.dialogRef.close({name: this.addonName} as AddonEntity);
  }
}
