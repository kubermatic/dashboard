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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {
  CredentialsType,
  OpenstackCredentialsTypeService,
} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {OpenstackCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {debounceTime, filter, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Credentials = 'credentials',
}

export interface OpenstackCredentials {
  username: string;
  password: string;
  project: string;
  projectID: string;
  applicationCredentialID: string;
  applicationCredentialSecret: string;
  floatingIPPool: string;
}

export enum Mode {
  Wizard,
  PresetCreation,
}

@Component({
    selector: 'km-openstack-credentials',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OpenstackCredentialsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => OpenstackCredentialsComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class OpenstackCredentialsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  readonly CredentialsType = CredentialsType;
  isPresetSelected = false;

  @Input()
  mode: Mode = Mode.Wizard;

  @Output()
  readonly onChange = new EventEmitter<OpenstackCredentials>();

  @Output()
  readonly onCredentialsTypeChange = new EventEmitter<CredentialsType>();

  get credentialsType(): CredentialsType {
    return this._credentialsTypeService.credentialsType;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService
  ) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Credentials]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    this.form
      .get(Controls.Credentials)
      .valueChanges.pipe(debounceTime(this._debounceTime))
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(filter(_ => !this._presets.preset))
      .pipe(tap(value => this.onChange.next(value)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(OpenstackCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.openstack))
      );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  changeView(event: MatButtonToggleChange): void {
    this._credentialsTypeService.credentialsType = event.value;
    this.onCredentialsTypeChange.emit(event.value);
    this.form.get(Controls.Credentials).reset();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
