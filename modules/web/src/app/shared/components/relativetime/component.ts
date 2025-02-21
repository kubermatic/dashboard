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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject, timer} from 'rxjs';
import {AppConfigService} from '@app/config.service';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'km-relative-time',
    templateUrl: './template.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class RelativeTimeComponent implements OnInit, OnDestroy {
  @Input() date: string;
  private readonly _unsubscribe = new Subject<void>();
  private readonly _refreshTime = 30;
  private _refreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    this._refreshTimer.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._changeDetectorRef.detectChanges());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
