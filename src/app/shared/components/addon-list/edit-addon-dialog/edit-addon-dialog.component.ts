import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AddonConfigEntity, AddonEntity} from '../../../entity/AddonEntity';
import {InstallAddonDialogComponent} from '../install-addon-dialog/install-addon-dialog.component';

@Component({
  selector: 'km-edit-addon-dialog',
  templateUrl: './edit-addon-dialog.component.html',
  styleUrls: ['./edit-addon-dialog.component.scss'],
})
export class EditAddonDialogComponent implements OnInit {
  @Input() addon: AddonEntity;
  @Input() addonConfig: AddonConfigEntity;
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<EditAddonDialogComponent>, private readonly _domSanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const group = {};
    if (this.addonConfig.spec.formSpec) {
      this.addonConfig.spec.formSpec.forEach(control => {
        group[control.internalName] = new FormControl(
            this.addon.spec.variables[control.internalName],
            InstallAddonDialogComponent.getControlValidators(control),
        );
      });
    }

    this.form = new FormGroup(group);
  }

  hasLogo(): boolean {
    return !!this.addonConfig && !!this.addonConfig.spec.logo && !!this.addonConfig.spec.logoFormat;
  }

  getAddonLogo(): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(
        `data:image/${this.addonConfig.spec.logoFormat};base64,${this.addonConfig.spec.logo}`);
  }

  private _getAddonPatch(): AddonEntity {
    const variables = {};

    Object.keys(this.form.controls).forEach(key => {
      variables[key] = this.form.controls[key].value;
    });

    return {name: this.addon.name, spec: {variables}};
  }

  edit(): void {
    this.dialogRef.close(this._getAddonPatch());
  }
}
