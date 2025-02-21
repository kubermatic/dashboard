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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {ServiceAccountTokenDialogService} from '@app/serviceaccount/token/add/steps/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

@Component({
    selector: 'km-serviceaccount-token-information-step',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ServiceAccountTokenInformationStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ServiceAccountTokenInformationStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class ServiceAccountTokenInformationStepComponent extends BaseFormValidator implements OnInit {
  get token(): string {
    return this._service.token;
  }

  constructor(
    private readonly _sanitizer: DomSanitizer,
    private readonly _service: ServiceAccountTokenDialogService,
    private readonly _builder: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({});

    const blob = new Blob([this.token], {
      type: 'text/plain',
    });

    this._service.downloadUrl = this._sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(blob));
    this._service.downloadTitle = window.location.host + '-' + this._service.projectID + '-' + this._service.tokenName;
  }
}
