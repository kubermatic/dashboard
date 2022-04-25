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

import {Injectable, Injector} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {filter, pairwise} from 'rxjs/operators';

@Injectable()
export class HistoryService {
  readonly onNavigationChange = new Subject<void>();

  private _router: Router;
  private _previousStateUrl: string;
  private _currentStateUrl: string;

  constructor(private readonly _injector: Injector) {}

  init(): void {
    if (!this._router) {
      this._router = this._injector.get(Router);

      this._router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .pipe(pairwise())
        .subscribe((e: [NavigationEnd, NavigationEnd]) => {
          if (e[0].url !== e[1].url && !this._isAdminPanelUrl(e[0].url)) {
            this._previousStateUrl = e[0].url;
            this._currentStateUrl = e[1].url;
            this.onNavigationChange.next();
          }
        });

      this._router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
        this._currentStateUrl = e.url;
        this.onNavigationChange.next();
      });
    }
  }

  goBack(defaultState: string): Promise<boolean> {
    if (this._previousStateUrl && this._previousStateUrl !== this._currentStateUrl) {
      return this._router.navigateByUrl(this._previousStateUrl);
    }

    return this._router.navigate([defaultState], {
      queryParamsHandling: 'preserve',
    });
  }

  private _isAdminPanelUrl(url: string): boolean {
    return url.startsWith('/settings');
  }
}
