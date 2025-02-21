// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {StepRegistry} from '@app/kubeone-wizard/config';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {KubeOneWizardService} from '@core/services/kubeone-wizard/wizard';
import {ExternalCloudSpec, ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneClusterSpec, KubeOneSSHKeySpec} from '@shared/entity/kubeone-cluster';
import {KmValidators} from '@shared/validators/validators';
import {ClipboardService} from 'ngx-clipboard';
import {merge} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {StepBase} from '../base';

enum Controls {
  Manifest = 'manifest',
  SSHKey = 'sshKey',
  Passphrase = 'passphrase',
}

@Component({
  selector: 'km-kubeone-wizard-cluster-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneClusterStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneClusterStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class KubeOneClusterStepComponent extends StepBase implements OnInit {
  readonly Controls = Controls;
  readonly manifestCommand = 'kubeone config dump -m kubeone.yaml -t tf.json';

  manifest = '';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    private readonly _clipboardService: ClipboardService,
    wizard: KubeOneWizardService
  ) {
    super(wizard, StepRegistry.Cluster);
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  onManifestChange(value: string): void {
    this.control(Controls.Manifest).setValue(value);
  }

  copyManifestCommand(): void {
    this._clipboardService.copy(this.manifestCommand);
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Manifest]: new FormControl('', [Validators.required, KmValidators.yaml()]),
      [Controls.SSHKey]: new FormControl('', [Validators.required]),
      [Controls.Passphrase]: new FormControl(''),
    });
  }

  private _initSubscriptions(): void {
    merge(
      this.control(Controls.Manifest).valueChanges,
      this.control(Controls.SSHKey).valueChanges,
      this.control(Controls.Passphrase).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  private _getClusterEntity(): ExternalCluster {
    return {
      cloud: {
        kubeOne: {
          manifest: this.controlValue(Controls.Manifest),
          sshKey: {
            privateKey: this.controlValue(Controls.SSHKey),
            passphrase: this.controlValue(Controls.Passphrase),
          } as KubeOneSSHKeySpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalCluster;
  }
}
