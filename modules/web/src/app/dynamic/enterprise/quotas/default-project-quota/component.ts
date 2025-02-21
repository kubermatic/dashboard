// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {QuotaVariables} from '@shared/entity/quota';
import {AdminSettings} from '@shared/entity/settings';
import {objectDiff} from '@shared/utils/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, filter, switchMap, takeUntil} from 'rxjs/operators';

enum Controls {
  CPU = 'cpu',
  Memory = 'memory',
  Storage = 'storage',
}

@Component({
  selector: 'km-default-project-quota',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
  standalone: false,
})
export class DefaultProjectQuotaComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;

  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.
  form: FormGroup;

  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isEqual(settingsQuota: QuotaVariables, apiSettingsQuota: QuotaVariables): boolean {
    return (
      ((!settingsQuota.cpu && !apiSettingsQuota?.cpu) || +settingsQuota.cpu === +apiSettingsQuota?.cpu) &&
      ((!settingsQuota.memory && !apiSettingsQuota?.memory) || +settingsQuota.memory === +apiSettingsQuota?.memory) &&
      ((!settingsQuota.storage && !apiSettingsQuota?.storage) || +settingsQuota.storage === +apiSettingsQuota?.storage)
    );
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.CPU]: this._builder.control('', [Validators.min(0)]),
      [Controls.Memory]: this._builder.control('', [Validators.min(0)]),
      [Controls.Storage]: this._builder.control('', [Validators.min(0)]),
    });
  }

  private _initSubscriptions(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings && !_.isEqual(this.apiSettings, this._settingsService.defaultAdminSettings)) {
          this._notificationService.success('Updated the admin settings');
        }
        this._applySettings(settings);
      }
    });

    this._settingsChange
      .pipe(
        filter(_ => !this.isEqual(this.settings.defaultQuota.quota, this.apiSettings.defaultQuota.quota)),
        switchMap(() => this._settingsService.patchAdminSettings(this._getPatch())),
        takeUntil(this._unsubscribe)
      )
      .subscribe();

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(filter(_ => this.form.valid))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.settings.defaultQuota.quota = {
          cpu: this.form.get(Controls.CPU).value,
          memory: this.form.get(Controls.Memory).value,
          storage: this.form.get(Controls.Storage).value,
        };
        this._settingsChange.next();
      });
  }

  private _applySettings(settings: AdminSettings): void {
    this.apiSettings = settings;
    this.settings = _.cloneDeep(this.apiSettings);
    if (!this.settings.defaultQuota?.quota) {
      this.settings.defaultQuota = {
        ...(this.settings.defaultQuota || {}),
        quota: {},
      };
    }
    this.form.patchValue(
      {
        [Controls.CPU]: this.settings.defaultQuota.quota.cpu,
        [Controls.Memory]: this.settings.defaultQuota.quota.memory,
        [Controls.Storage]: this.settings.defaultQuota.quota.storage,
      },
      {emitEvent: false}
    );
  }

  private _getPatch(): AdminSettings {
    return objectDiff(this.settings, this.apiSettings);
  }
}
