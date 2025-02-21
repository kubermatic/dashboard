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
import {Subject} from 'rxjs';
import {SettingsService} from '@core/services/settings';
import {map, takeUntil} from 'rxjs/operators';
import {Router} from '@angular/router';
import {View} from '@app/shared/entity/common';

@Component({
    selector: 'km-clusters',
    templateUrl: './template.html',
    standalone: false
})
export class ClustersComponent implements OnInit, OnDestroy {
  private _unsubscribe: Subject<void> = new Subject<void>();
  readonly view = View;
  areExternalClustersEnabled = false;
  resourcesType = '';

  constructor(
    private readonly _settingsService: SettingsService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings
      .pipe(
        map(settings => settings.enableExternalClusterImport),
        takeUntil(this._unsubscribe)
      )
      .subscribe(areExternalClustersEnabled => (this.areExternalClustersEnabled = areExternalClustersEnabled));

    this.checkResourcesType();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  checkResourcesType(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.resourcesType = urlArray[urlArray.length - 1];
  }
}
