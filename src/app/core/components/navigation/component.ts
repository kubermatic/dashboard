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

import {Component, Input, OnInit} from '@angular/core';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-navigation',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class NavigationComponent implements OnInit {
  @Input() showMenuSwitchAndProjectSelector: boolean;
  showSidenav = true;
  private _settingsChange = new Subject<void>();
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(private readonly _auth: Auth, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.showSidenav = !settings.collapseSidenav;
    });

    this._settingsChange
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this._userService.patchCurrentUserSettings({
            collapseSidenav: !this.showSidenav,
          })
        )
      )
      .subscribe(settings => {
        this.showSidenav = !settings.collapseSidenav;
      });
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated();
  }

  collapseSidenav(): void {
    this.showSidenav = !this.showSidenav;
    this._settingsChange.next();
  }
}
