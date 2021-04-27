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
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {
  Addon,
  AddonConfig,
  AddonFormSpec,
  getAddonLogoData,
  getAddonShortDescription,
  hasAddonFormData,
  hasAddonLogoData,
} from '@shared/entity/addon';
import {FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';

export enum Controls {
  ContinuouslyReconcile = 'continuouslyReconcile',
}

@Component({
  selector: 'km-select-addon-dialog',
  templateUrl: './install-addon-dialog.component.html',
  styleUrls: ['./install-addon-dialog.component.scss'],
})
export class InstallAddonDialogComponent {
  static getControlValidators(control: AddonFormSpec): ValidatorFn[] {
    return control.required ? [Validators.required] : [];
  }

  readonly Controls = Controls;
  @Input() installableAddons: string[] = [];
  @Input() addonConfigs = new Map<string, AddonConfig>();
  selectedAddon: string;
  form: FormGroup;
  formBasic: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<InstallAddonDialogComponent>,
    private readonly _domSanitizer: DomSanitizer,
    private readonly _builder: FormBuilder
  ) {}

  hasLogo(name: string): boolean {
    return hasAddonLogoData(this.addonConfigs.get(name));
  }

  hasForm(name: string): boolean {
    return hasAddonFormData(this.addonConfigs.get(name));
  }

  getAddonLogo(name: string): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(getAddonLogoData(this.addonConfigs.get(name)));
  }

  getAddonShortDescription(name: string): string {
    return getAddonShortDescription(this.addonConfigs.get(name));
  }

  select(name: string): void {
    this.selectedAddon = name;
    this._initializeForm(this.selectedAddon);
  }

  install(): void {
    this.dialogRef.close(this._getAddonEntity());
  }

  private _initializeForm(name: string): void {
    const group = {};
    if (this.hasForm(name)) {
      this.addonConfigs.get(name).spec.formSpec.forEach(control => {
        group[control.internalName] = new FormControl(
          undefined,
          InstallAddonDialogComponent.getControlValidators(control)
        );
      });
    }

    this.form = new FormGroup(group);
    this.formBasic = this._builder.group({
      [Controls.ContinuouslyReconcile]: this._builder.control(false),
    });
  }

  private _getAddonEntity(): Addon {
    const variables = {};

    Object.keys(this.form.controls).forEach(key => {
      variables[key] = this.form.controls[key].value;
    });

    return {
      name: this.selectedAddon,
      spec: {variables, continuouslyReconcile: this.formBasic.controls.continuouslyReconcile.value},
    };
  }
}
