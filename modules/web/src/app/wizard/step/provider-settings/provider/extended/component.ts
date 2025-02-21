// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  ProviderExtended = 'providerExtended',
}

@Component({
    selector: 'km-wizard-provider-extended',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ProviderExtendedComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ProviderExtendedComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class ProviderExtendedComponent extends BaseFormValidator implements OnInit {
  @Input() provider: NodeProvider;
  @Input() visible = false;

  readonly Providers = NodeProvider;
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderExtended]: this._builder.control(''),
    });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.form.removeControl(Controls.ProviderExtended);
        this.form.addControl(Controls.ProviderExtended, this._builder.control(''));
      });
  }
}
