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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ServiceAccountTokenDialogService} from '@app/serviceaccount/token/add/steps/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';
import {LabelFormValidators} from '@shared/validators/label-form.validators';

enum Controls {
  Name = 'name',
}

@Component({
    selector: 'km-serviceaccount-token-name-step',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ServiceAccountTokenNameStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ServiceAccountTokenNameStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class ServiceAccountTokenNameStepComponent extends BaseFormValidator implements OnInit {
  readonly controls = Controls;

  get projectID(): string {
    return this._service.projectID;
  }

  constructor(
    private readonly _service: ServiceAccountTokenDialogService,
    private readonly _builder: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(
        '',
        Validators.compose([
          Validators.required,
          LabelFormValidators.labelValueLength,
          LabelFormValidators.labelValuePattern,
        ])
      ),
    });

    this.form
      .get(Controls.Name)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(name => (this._service.tokenName = name));
  }
}
