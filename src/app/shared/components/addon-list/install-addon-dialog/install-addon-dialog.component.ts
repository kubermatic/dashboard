import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {
  AddonConfig,
  Addon,
  AddonFormSpec,
  getAddonLogoData,
  hasAddonFormData,
  hasAddonLogoData,
} from '../../../entity/addon';

@Component({
  selector: 'km-install-addon-dialog',
  templateUrl: './install-addon-dialog.component.html',
  styleUrls: ['./install-addon-dialog.component.scss'],
})
export class InstallAddonDialogComponent implements OnInit {
  @Input() addonName: string;
  @Input() addonConfig: AddonConfig;
  form: FormGroup;

  static getControlValidators(control: AddonFormSpec): ValidatorFn[] {
    return control.required ? [Validators.required] : [];
  }

  static getFormState(control: AddonFormSpec): string | number {
    return control.type === 'number' ? 0 : '';
  }

  constructor(
    public dialogRef: MatDialogRef<InstallAddonDialogComponent>,
    private readonly _domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const group = {};
    if (this.hasForm()) {
      this.addonConfig.spec.formSpec.forEach(control => {
        group[control.internalName] = new FormControl(
          InstallAddonDialogComponent.getFormState(control),
          InstallAddonDialogComponent.getControlValidators(control)
        );
      });
    }

    this.form = new FormGroup(group);
  }

  hasForm(): boolean {
    return hasAddonFormData(this.addonConfig);
  }

  hasLogo(): boolean {
    return hasAddonLogoData(this.addonConfig);
  }

  getAddonLogo(): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(getAddonLogoData(this.addonConfig));
  }

  private _getAddonEntity(): Addon {
    const variables = {};

    Object.keys(this.form.controls).forEach(key => {
      variables[key] = this.form.controls[key].value;
    });

    return {name: this.addonName, spec: {variables}};
  }

  install(): void {
    this.dialogRef.close(this._getAddonEntity());
  }
}
