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

import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {Context} from '@shared/components/tab-card/component';
import {DynamicTabComponent} from '@shared/components/tab-card/dynamic-tab/component';
import {DynamicTab} from '@shared/model/dynamic-tab';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'km-admin-settings-opa',
    templateUrl: './template.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AdminSettingsOPAComponent implements OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Context = Context;
  private _dynamicTabs = new Set<DynamicTabComponent>();

  get dynamicTabs(): DynamicTabComponent[] {
    return [...this._dynamicTabs];
  }

  onActivate(component: DynamicTab): void {
    component.onTabReady.pipe(takeUntil(this._unsubscribe)).subscribe(tab => this._dynamicTabs.add(tab));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
