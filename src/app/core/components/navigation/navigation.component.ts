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

import {Component, Input, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {Auth} from '../../services';
import {SettingsService} from '../../services/settings/settings.service';

@Component({
  selector: 'km-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  @Input() showMenuSwitchAndProjectSelector: boolean;
  showSidenav = true;
  private _settingsChange = new Subject<void>();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _auth: Auth, private _settingsService: SettingsService) {}

  ngOnInit(): void {
    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.showSidenav = !settings.collapseSidenav;
    });

    this._settingsChange
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this._settingsService.patchUserSettings({
            collapseSidenav: !this.showSidenav,
          })
        )
      )
      .subscribe(settings => {
        this._settingsService.refreshUserSettings();
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
