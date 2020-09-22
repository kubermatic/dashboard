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

import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AddonConfig, Addon, getAddonLogoData, hasAddonLogoData} from '../../../entity/addon';
import {InstallAddonDialogComponent} from '../install-addon-dialog/install-addon-dialog.component';

export enum Controls {
  ContinuouslyReconcile = 'continuouslyReconcile',
}

@Component({
  selector: 'km-edit-addon-dialog',
  templateUrl: './edit-addon-dialog.component.html',
  styleUrls: ['./edit-addon-dialog.component.scss'],
})
export class EditAddonDialogComponent implements OnInit {
  readonly Controls = Controls;

  @Input() addon: Addon;
  @Input() addonConfig: AddonConfig;
  form: FormGroup;
  formBasic: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditAddonDialogComponent>,
    private readonly _domSanitizer: DomSanitizer,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    const group = {};
    if (this.addonConfig.spec.formSpec) {
      this.addonConfig.spec.formSpec.forEach(control => {
        group[control.internalName] = new FormControl(
          this.addon.spec.variables[control.internalName],
          InstallAddonDialogComponent.getControlValidators(control)
        );
      });
    }

    this.form = new FormGroup(group);

    this.formBasic = this._builder.group({
      [Controls.ContinuouslyReconcile]: this._builder.control(this.addon.spec.continuouslyReconcile),
    });
  }

  hasLogo(): boolean {
    return hasAddonLogoData(this.addonConfig);
  }

  getAddonLogo(): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(getAddonLogoData(this.addonConfig));
  }

  private _getAddonPatch(): Addon {
    const variables = {};

    Object.keys(this.form.controls).forEach(key => {
      variables[key] = this.form.controls[key].value;
    });

    return {
      name: this.addon.name,
      spec: {variables, continuouslyReconcile: this.formBasic.controls.continuouslyReconcile.value},
    };
  }

  edit(): void {
    this.dialogRef.close(this._getAddonPatch());
  }
}
