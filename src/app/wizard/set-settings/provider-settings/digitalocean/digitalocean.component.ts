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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {Cluster} from '../../../../shared/entity/cluster';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'km-digitalocean-cluster-settings',
  templateUrl: './digitalocean.component.html',
})
export class DigitaloceanClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  form: FormGroup;
  tokenRequired = true;

  private _formHelper: FormHelper;
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      token: new FormControl(this.cluster.spec.cloud.digitalocean.token, [
        Validators.minLength(64),
        Validators.maxLength(64),
      ]),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(this.form.controls.token);

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._formHelper.areControlsValid()
          ? this._wizard.onCustomPresetsDisable.emit(false)
          : this._wizard.onCustomPresetsDisable.emit(true);

        this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
      });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      if (preset) {
        this.form.disable();
        this.tokenRequired = false;
        this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(true));
        return;
      }

      this.form.enable();
      this.tokenRequired = true;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        digitalocean: {
          token: this.form.controls.token.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
