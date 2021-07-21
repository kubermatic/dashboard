// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  OnDestroy,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {NavTabComponent} from '@shared/components/tab-navigation/tab/component';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-tab-navigation',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNavigationComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(NavTabComponent) inputTabs: QueryList<NavTabComponent>;
  tabs: NavTabComponent[];
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  public ngAfterContentInit(): void {
    // Initialization.
    this.tabs = this.inputTabs.toArray();
    this._cdr.detectChanges();

    // Watch for tab changes and update the component.
    this.inputTabs.changes.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.tabs = this.inputTabs.toArray();
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
