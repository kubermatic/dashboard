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

import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil, filter} from 'rxjs/operators';

@Directive({
    selector: '[kmAutofocus]',
    standalone: false
})
export class AutofocusDirective implements AfterViewInit, OnDestroy {
  @Input() opened: EventEmitter<boolean>;

  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.opened) {
      this.opened
        .pipe(filter(open => open))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._focus.bind(this));
    } else {
      this._focus();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _focus(): void {
    setTimeout(() => this._el.nativeElement.focus());
  }
}
