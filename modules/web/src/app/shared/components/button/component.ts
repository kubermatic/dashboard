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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {throttleTime} from 'rxjs/operators';

@Component({
  selector: 'km-button',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent<T> implements OnInit, OnDestroy {
  @Input() icon: string;
  @Input() label: string;
  @Input() color: string;
  @Input() buttonId: string;
  @Input() observable: Observable<T>;
  @Input() disabled = false;
  @Input() iconButton: string;
  @Output() next = new EventEmitter<T>();
  @Output() error = new EventEmitter<void>();
  loading = false;
  private _clicks = new Subject<void>();
  private readonly _throttleTime = 1000;

  ngOnInit(): void {
    this._clicks.pipe(throttleTime(this._throttleTime)).subscribe(_ => {
      this._subscribe();
    });
  }

  ngOnDestroy(): void {
    this._clicks.complete();
  }

  onClick(): void {
    this.loading = true;
    this._clicks.next();
  }

  private _subscribe(): void {
    this.observable.subscribe({
      next: result => {
        this.next.emit(result);
        this.loading = false;
      },
      error: _ => {
        this.error.next();
        this.loading = false;
      },
    });
  }
}
