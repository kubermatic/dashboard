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

import {Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {throttleTime} from 'rxjs/operators';

@Directive({
  selector: '[kmThrottleClick]',
  standalone: false,
})
export class ThrottleClickDirective implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  @Input() throttleTime = 500;
  @Output() throttleClick = new EventEmitter();
  private _clicks = new Subject();
  private _subscription: Subscription;

  ngOnInit(): void {
    this._subscription = this._clicks
      .pipe(throttleTime(this.throttleTime))
      .subscribe(res => this.throttleClick.emit(res));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  @HostListener('click', ['$event'])
  clickEvent(event): void {
    event.preventDefault();
    event.stopPropagation();
    this._clicks.next(event);
  }
}
