import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AddonConfigEntity, AddonEntity} from '../../../entity/AddonEntity';

@Component({
  selector: 'km-select-addon-dialog',
  templateUrl: './select-addon-dialog.component.html',
  styleUrls: ['./select-addon-dialog.component.scss'],
})
export class SelectAddonDialogComponent {
  @Input() installableAddons: string[] = [];
  @Input() addonConfigs = new Map<string, AddonConfigEntity>();

  constructor(
      public dialogRef: MatDialogRef<SelectAddonDialogComponent>, private readonly _domSanitizer: DomSanitizer) {}

  hasLogo(name: string): boolean {
    const addonConfig = this.addonConfigs.get(name);
    return !!addonConfig && !!addonConfig.spec.logo;
  }

  getAddonLogo(name: string): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(
        `data:image/svg+xml;base64,${this.addonConfigs.get(name).spec.logo}`);
  }

  getAddonDescription(name: string): string {
    const addonConfig = this.addonConfigs.get(name);
    return addonConfig ? addonConfig.spec.description : '';
  }

  add(name: string): void {
    this.dialogRef.close({name} as AddonEntity);
  }
}
