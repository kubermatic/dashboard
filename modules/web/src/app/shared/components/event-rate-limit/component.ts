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

import {Component, forwardRef, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  FormControl,
  Validators,
  FormGroup,
  FormArray,
} from '@angular/forms';
import {EventRateLimitConfig, EventRateLimitConfigItem} from '@shared/entity/cluster';
import {takeUntil} from 'rxjs/operators';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {DialogModeService} from '@app/core/services/dialog-mode';
import _ from 'lodash';

enum Controls {
  EventRateLimitConfig = 'eventRateLimitConfig',
  QPS = 'qps',
  Burst = 'burst',
  CacheSize = 'cacheSize',
  LimitType = 'limitType',
}

enum EventRateLimitTypes {
  Namespace = 'namespace',
  Server = 'server',
  User = 'user',
  SourceAndObject = 'sourceAndObject',
}

const DEFAULT_EVENT_RATE_LIMIT_CONFIG: EventRateLimitConfigItem = {
  qps: 50,
  burst: 100,
  cacheSize: 4096,
  limitType: 'namespace',
};

@Component({
  selector: 'km-wizard-cluster-event-rate-limit',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
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
  standalone: false,
})
export class EventRateLimitComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @Input() eventRateLimitConfig: EventRateLimitConfig;
  @Input() disableAll = false;

  form: FormGroup;
  readonly Controls = Controls;
  private readonly _minValue = 1;
  private readonly MIN_EVENT_RATE_LIMIT_ELEMENTS = 2;
  readonly eventRateLimitTypes = EventRateLimitTypes;
  eventRateLimitTypeKeys = Object.keys(EventRateLimitTypes);
  chosenEventRateLimitTypes: string[] = [];
  isEditDialog = this._dialogModeService.isEditDialog;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _dialogModeService: DialogModeService
  ) {
    super();
  }

  get eventRateLimitConfigArray(): FormArray {
    return this.form.get(Controls.EventRateLimitConfig) as FormArray;
  }

  ngOnInit(): void {
    this.form = this._builder.group({[Controls.EventRateLimitConfig]: this._builder.array([])});

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._refreshChosenTypes();
      this.addTypeIfNeeded();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  writeValue(eventRateLimitConfig: EventRateLimitConfig) {
    this.eventRateLimitConfig = eventRateLimitConfig;
    this.eventRateLimitConfigArray.clear();
    const eventRateLimitConfigKeys = eventRateLimitConfig ? Object.keys(eventRateLimitConfig) : [];
    if (eventRateLimitConfigKeys.length > 0) {
      Object.keys(eventRateLimitConfig).forEach(limitType => {
        const config = eventRateLimitConfig[limitType];
        this.addEventType(limitType, config.qps, config.burst, config.cacheSize);
      });
    } else {
      this.addEventType(
        DEFAULT_EVENT_RATE_LIMIT_CONFIG.limitType,
        DEFAULT_EVENT_RATE_LIMIT_CONFIG.qps,
        DEFAULT_EVENT_RATE_LIMIT_CONFIG.burst,
        DEFAULT_EVENT_RATE_LIMIT_CONFIG.cacheSize
      );
    }
    this._refreshChosenTypes();
  }

  addTypeIfNeeded(): void {
    const configLength = this.eventRateLimitConfig ? Object.keys(this.eventRateLimitConfig).length : 0;
    if (
      this.eventRateLimitConfigArray.length < configLength ||
      this.eventRateLimitConfigArray.length >= this.eventRateLimitTypeKeys.length
    ) {
      return;
    }
    const lastFormControlGroup = this.eventRateLimitConfigArray.at(
      this.eventRateLimitConfigArray.length - 1
    ) as FormGroup;
    if (
      lastFormControlGroup?.get(Controls.LimitType).value &&
      lastFormControlGroup?.get(Controls.QPS).value &&
      lastFormControlGroup?.get(Controls.Burst).value &&
      lastFormControlGroup?.get(Controls.CacheSize).value
    ) {
      this.addEventType();
    }
  }

  addEventType(limitType: string = null, qps: number = null, burst: number = null, cacheSize: number = null): void {
    this.eventRateLimitConfigArray.push(
      this._builder.group({
        [Controls.QPS]: new FormControl(qps),
        [Controls.Burst]: new FormControl(burst),
        [Controls.CacheSize]: new FormControl(cacheSize),
        [Controls.LimitType]: new FormControl(limitType),
      })
    );
  }

  onChangeType(value: string, index: number): void {
    const group = this.eventRateLimitConfigArray.at(index) as FormGroup;
    if (value) {
      const validators = [Validators.required, Validators.min(this._minValue)];

      [Controls.QPS, Controls.Burst, Controls.CacheSize].forEach(control => {
        group.get(control).setValidators(validators);
        group.get(control).updateValueAndValidity();
      });

      // Auto-populate defaults when type is selected
      if (!group.get(Controls.QPS).value) {
        group.patchValue({
          [Controls.QPS]: DEFAULT_EVENT_RATE_LIMIT_CONFIG.qps,
          [Controls.Burst]: DEFAULT_EVENT_RATE_LIMIT_CONFIG.burst,
          [Controls.CacheSize]: DEFAULT_EVENT_RATE_LIMIT_CONFIG.cacheSize,
        });
      }
    }
  }

  isRequired(index: number): boolean {
    return !!this.eventRateLimitConfigArray.at(index).get(Controls.LimitType).value;
  }

  removeType(index: number): void {
    const group = this.eventRateLimitConfigArray.at(index) as FormGroup;
    if (index === this.eventRateLimitConfigArray.length - 1) {
      group.get(Controls.LimitType).setValue(null);
      [Controls.QPS, Controls.Burst, Controls.CacheSize].forEach(control => {
        group.get(control).setValue(null);
        group.get(control).clearValidators();
        group.get(control).updateValueAndValidity();
      });
    } else {
      this.eventRateLimitConfigArray.removeAt(index);
    }
  }

  isChosenType(type: string, control: FormGroup): boolean {
    return this.chosenEventRateLimitTypes.includes(type) && control.get(Controls.LimitType).value !== type;
  }

  blockDeletion(index: number): boolean {
    return !this.isRequired(index) || this.eventRateLimitConfigArray.length === this.MIN_EVENT_RATE_LIMIT_ELEMENTS;
  }

  private _refreshChosenTypes(): void {
    this.chosenEventRateLimitTypes = this.eventRateLimitConfigArray.controls
      .map(control => control.get(Controls.LimitType).value)
      .filter(type => !!type);
  }
}
