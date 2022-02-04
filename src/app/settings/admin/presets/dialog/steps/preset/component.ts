// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Name = 'name',
  Domain = 'domain',
  Disable = 'disable',
}

@Component({
  selector: 'km-preset-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PresetStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PresetStepComponent),
      multi: true,
    },
  ],
})
export class PresetStepComponent extends BaseFormValidator implements OnInit {
  readonly controls = Controls;
  readonly domainRegex = new RegExp('^(?!-)[A-Za-z0-9-]+([\\-.][a-z0-9]+)*\\.[A-Za-z]{2,6}$');

  constructor(private readonly _builder: FormBuilder, private readonly _presetDialogService: PresetDialogService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: new FormControl('', [Validators.required]),
      [Controls.Domain]: new FormControl(''),
      [Controls.Disable]: new FormControl(''),
    });

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Domain).valueChanges,
      this.form.get(Controls.Disable).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._update());
  }

  private _update(): void {
    this._presetDialogService.preset.metadata.name = this.form.get(Controls.Name).value;
    this._presetDialogService.preset.spec.requiredEmails = this.form.get(Controls.Domain).value;
    this._presetDialogService.preset.spec.enabled = !this.form.get(Controls.Disable).value;
  }
}
