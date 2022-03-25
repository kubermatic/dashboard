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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {throttleTime} from 'rxjs/operators';

@Component({
  selector: 'km-button',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ButtonComponent implements OnInit, OnDestroy {
  @Input() icon: string;
  @Input() label: string;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() throttleClick = new EventEmitter<void>();
  private _clicks = new Subject<void>();
  private readonly _throttleTime = 1000;

  ngOnInit(): void {
    this._clicks.pipe(throttleTime(this._throttleTime)).subscribe(_ => this.throttleClick.emit());
  }

  ngOnDestroy(): void {
    this._clicks.complete();
  }

  onClick(): void {
    this.loading = true;
    this._clicks.next();
  }
}
