import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AddonConfigEntity, AddonEntity} from '../../../entity/AddonEntity';

@Component({
  selector: 'km-add-addon-dialog',
  templateUrl: './add-addon-dialog.component.html',
  styleUrls: ['./add-addon-dialog.component.scss'],
})
export class AddAddonDialogComponent implements OnInit {
  @Input() installableAddons: string[] = [];
  @Input() addonConfigs = new Map<string, AddonConfigEntity>();
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<AddAddonDialogComponent>, private readonly _domSanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.form = new FormGroup({name: new FormControl('', [Validators.required])});

    if (this.installableAddons.length > 0) {
      this.form.controls.name.setValue(this.installableAddons[0]);
    }
  }

  hasLogo(name: string): boolean {
    return !!this.addonConfigs.get(name);
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
