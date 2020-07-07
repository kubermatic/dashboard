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

import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[kmAutofocus]',
})
export class AutofocusDirective implements AfterViewInit, OnDestroy {
  @Input() opened: EventEmitter<boolean>;

  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _el: ElementRef) {}

  ngAfterViewInit(): void {
    if (!this.opened) {
      throw new Error('[opened] event binding is undefined');
    }

    this.opened.pipe(takeUntil(this._unsubscribe)).subscribe(opened => {
      if (opened) {
        setTimeout(() => this._el.nativeElement.focus());
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
