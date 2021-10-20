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

import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';

@Injectable()
export class PreviousRouteService {
  private _history = [];

  constructor(private router: Router) {}

  loadRouting(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((urlAfterRedirects: NavigationEnd) => {
        this._history = [...this._history, urlAfterRedirects];
        const maxHistoryLen = 10;
        if (this._history.length > maxHistoryLen) {
          this._history.splice(0, 1);
        }
      });
  }

  getHistory(): string[] {
    return this._history;
  }

  getPreviousUrl(): string {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return this._history[this._history.length - 2] || '/';
  }
}
