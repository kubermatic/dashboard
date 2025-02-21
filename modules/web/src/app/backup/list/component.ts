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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {SettingsService} from '@app/core/services/settings';
import {View} from '@app/shared/entity/common';
import {AdminSettings} from '@app/shared/entity/settings';
import {Subject, takeUntil} from 'rxjs';

@Component({
    selector: 'km-backups',
    templateUrl: './template.html',
    standalone: false
})
export class BackupsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly view = View;
  enableEtcdBackup: boolean;
  etcdBackupType = '';

  constructor(
    private _router: Router,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.getEtcdBackupType();
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe((settings: AdminSettings) => {
      this.enableEtcdBackup = settings.enableEtcdBackup;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getEtcdBackupType(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.etcdBackupType = urlArray[urlArray.length - 1];
  }
}
