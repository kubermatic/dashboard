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

import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, FormControl, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {EventRateLimitConfig} from '@shared/entity/cluster';
import {merge} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  QPS = 'qps',
  Burst = 'burst',
  CacheSize = 'cacheSize',
  LimitType = 'limitType',
}

@Component({
  selector: 'km-wizard-cluster-event-rate-limit',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EventRateLimitComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EventRateLimitComponent),
      multi: true,
    },
  ],
})
export class EventRateLimitComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @Input() eventRateLimitConfig: EventRateLimitConfig;

  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  private readonly _minValue = 1;
  private readonly _qpsDefault = 50;
  private readonly _burstDefault = 100;
  private readonly _cacheSizeDefault = 4096;
  private readonly _defaultLimitType = 'Namespace';

  constructor(private readonly _builder: FormBuilder, private readonly _clusterSpecService: ClusterSpecService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.QPS]: new FormControl(this.eventRateLimitConfig?.namespace?.qps || this._qpsDefault, [
        Validators.required,
        Validators.minLength(this._minValue),
      ]),
      [Controls.Burst]: new FormControl(this.eventRateLimitConfig?.namespace?.burst || this._burstDefault, [
        Validators.required,
        Validators.minLength(this._minValue),
      ]),
      [Controls.CacheSize]: new FormControl(this.eventRateLimitConfig?.namespace?.cacheSize || this._cacheSizeDefault, [
        Validators.required,
        Validators.minLength(this._minValue),
      ]),
      [Controls.LimitType]: new FormControl({value: this._defaultLimitType, disabled: true}),
    });

    merge(
      this.form.get(Controls.QPS).valueChanges,
      this.form.get(Controls.Burst).valueChanges,
      this.form.get(Controls.CacheSize).valueChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.eventRateLimitConfig = this._getEventRateLimitConfigPatch()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._clusterSpecService.eventRateLimitConfig = null;
  }

  writeValue(eventRateLimitConfig: EventRateLimitConfig) {
    if (eventRateLimitConfig) {
      this.form.get(Controls.QPS).setValue(eventRateLimitConfig?.namespace?.qps, {emitEvent: false});
      this.form.get(Controls.Burst).setValue(eventRateLimitConfig?.namespace?.burst, {emitEvent: false});
      this.form.get(Controls.CacheSize).setValue(eventRateLimitConfig?.namespace?.cacheSize, {emitEvent: false});
      this.eventRateLimitConfig = eventRateLimitConfig;
    }
  }

  private _getEventRateLimitConfigPatch(): EventRateLimitConfig {
    return {
      namespace: {
        qps: this.form.get(Controls.QPS).value,
        burst: this.form.get(Controls.Burst).value,
        cacheSize: this.form.get(Controls.CacheSize).value,
      },
    };
  }
}
