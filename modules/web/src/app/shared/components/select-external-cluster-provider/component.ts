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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';

enum Controls {
  Provider = 'provider',
}

@Component({
    selector: 'km-select-external-cluster-provider',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class SelectExternalClusterProviderComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  form: FormGroup;
  @Input() providers: ExternalClusterProvider[] = [];
  @Output() providerChange = new EventEmitter<string>();

  constructor(private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });
  }

  private _initSubscriptions() {
    this.form
      .get(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => this.providerChange.emit(provider));
  }
}
