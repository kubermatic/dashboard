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

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  ProviderBasic = 'providerBasic',
}

@Component({
    selector: 'km-basic-node-data',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BasicNodeDataComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => BasicNodeDataComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class BasicNodeDataComponent extends BaseFormValidator implements OnInit {
  @Input() provider: string;

  readonly Provider = NodeProvider;
  readonly Control = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderBasic]: this._builder.control(''),
    });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.form.removeControl(Controls.ProviderBasic);
        this.form.addControl(Controls.ProviderBasic, this._builder.control(''));
      });
  }
}
