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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {EventRateLimitConfig, EventRateLimitConfigItem} from '@shared/entity/cluster';
import {debounceTime, takeUntil, tap} from 'rxjs/operators';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {DialogModeService} from '@app/core/services/dialog-mode';

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

  form: FormGroup;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  private readonly _minValue = 1;
  private readonly MIN_EVENT_RATE_LIMIT_ELEMENTS = 2;
  readonly eventRateLimitTypes = EventRateLimitTypes;
  eventRateLimitTypeKeys = Object.keys(EventRateLimitTypes);
  chosenEventRateLimitTypes: string[] = [];
  isEditDialog = this._dialogModeService.isEditDialog;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _dialogModeService: DialogModeService
  ) {
    super();
  }

  get eventRateLimitConfigArray(): FormArray {
    return this.form.get(Controls.EventRateLimitConfig) as FormArray;
  }

  ngOnInit(): void {
    this.form = this._builder.group({[Controls.EventRateLimitConfig]: this._builder.array([])});

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        tap(_ => {
          this._refreshChosenTypes();
          this.addTypeIfNeeded();
        })
      )
      .pipe(debounceTime(this._debounceTime))
      .subscribe(_ => {
        {
          this._clusterSpecService.eventRateLimitConfig = this._getEventRateLimitConfigPatch();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._clusterSpecService.eventRateLimitConfig = null;
  }

  writeValue(eventRateLimitConfig: EventRateLimitConfig) {
    this.eventRateLimitConfig = eventRateLimitConfig;
    this.eventRateLimitConfigArray.clear();

    if (eventRateLimitConfig) {
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
    if (
      this.eventRateLimitConfigArray.length < Object.keys(this.eventRateLimitConfig).length ||
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
    const controls = this.eventRateLimitConfigArray.at(index);
    if (value) {
      controls.get(Controls.QPS).setValidators([Validators.required, Validators.min(this._minValue)]);
      controls.get(Controls.Burst).setValidators([Validators.required, Validators.min(this._minValue)]);
      controls.get(Controls.CacheSize).setValidators([Validators.required, Validators.min(this._minValue)]);
    }
  }

  isRequired(index: number): boolean {
    return this.eventRateLimitConfigArray.at(index).get(Controls.LimitType).value ? true : false;
  }

  removeType(index: number): void {
    const controls = this.eventRateLimitConfigArray.at(index);
    if (index === this.eventRateLimitConfigArray.length - 1) {
      controls.get(Controls.LimitType).setValue(null);
      controls.get(Controls.QPS).setValue(null);
      controls.get(Controls.Burst).setValue(null);
      controls.get(Controls.CacheSize).setValue(null);
    } else {
      this.eventRateLimitConfigArray.removeAt(index);
    }
  }

  ischosenType(type: string, control: FormGroup): boolean {
    return this.chosenEventRateLimitTypes.includes(type) && control.get(Controls.LimitType).value !== type;
  }

  blockDeletion(index: number): boolean {
    return !this.isRequired(index) || this.eventRateLimitConfigArray.length === this.MIN_EVENT_RATE_LIMIT_ELEMENTS;
  }

  private _getEventRateLimitConfigPatch(): EventRateLimitConfig {
    const ERLConfig: EventRateLimitConfig = {};
    this.eventRateLimitConfigArray.controls.forEach(control => {
      const type = control.get(Controls.LimitType).value;
      if (type) {
        ERLConfig[type] = {
          qps: control.get(Controls.QPS).value,
          burst: control.get(Controls.Burst).value,
          cacheSize: control.get(Controls.CacheSize).value,
        };
      }
    });
    return ERLConfig;
  }

  private _refreshChosenTypes(): void {
    this.chosenEventRateLimitTypes = this.eventRateLimitConfigArray.controls
      .map(control => control.get(Controls.LimitType).value)
      .filter(type => !!type);
  }
}
