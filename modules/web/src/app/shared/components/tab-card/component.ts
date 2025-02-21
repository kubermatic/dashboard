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

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {DynamicTabComponent} from '@shared/components/tab-card/dynamic-tab/component';
import {TabComponent} from '@shared/components/tab-card/tab/component';
import {Subject} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';

export enum Context {
  Card = 'tab-cards',
  Navigation = 'tab-navigation',
}

@Component({
  selector: 'km-tab-card',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TabCardComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(TabComponent) inputTabs: QueryList<TabComponent>;
  @Input() dynamicTabs: DynamicTabComponent[];
  @Input() context: Context = Context.Card;
  @Input() verticalMargin = true;
  tabs: TabComponent[];
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.inputTabs.changes.pipe(startWith(true)).pipe(takeUntil(this._unsubscribe)).subscribe(this._init.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getClass(): string {
    return 'tab-card ' + this.context + (this.verticalMargin ? ' vertical-margin' : '');
  }

  private _init(): void {
    this.tabs = this.inputTabs.toArray();
    this._cdr.detectChanges();
  }
}
