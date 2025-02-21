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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user';
import {merge, of, Subject} from 'rxjs';
import {switchMapTo, take, takeUntil, filter} from 'rxjs/operators';

const enum ViewName {
  Projects = 'Projects',
  UserSettings = 'User Settings',
  AdminSettings = 'Admin Settings',
  TermsOfServices = 'Terms of Service',
  RestApi = 'API Docs',
}

const enum RoutePath {
  Projects = 'projects',
  Account = 'account',
  Settings = 'settings',
  TermsOfServices = 'terms-of-service',
  RestApi = 'rest-api',
}

@Component({
  selector: 'km-navigation',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class NavigationComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _onSettingsChange = new Subject<void>();
  @Input() showMenuSwitchAndProjectSelector: boolean;
  @Input() hasSecondarySidenav: boolean;
  showSidenav = true;
  currentView: string;

  constructor(
    private readonly _auth: Auth,
    private readonly _userService: UserService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    merge(of(true), this._onSettingsChange)
      .pipe(switchMapTo(this._userService.currentUserSettings))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this.showSidenav = !settings.collapseSidenav));

    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: (event: NavigationEnd) => {
          const currentRoute = event.url.split('/')[1];
          switch (currentRoute) {
            case RoutePath.Projects:
              this.currentView = ViewName.Projects;
              break;
            case RoutePath.Account:
              this.currentView = ViewName.UserSettings;
              break;
            case RoutePath.Settings:
              this.currentView = ViewName.AdminSettings;
              break;
            case RoutePath.TermsOfServices:
              this.currentView = ViewName.TermsOfServices;
              break;
            case RoutePath.RestApi:
              this.currentView = ViewName.RestApi;
              break;
            default:
              this.currentView = '';
          }
        },
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated();
  }

  collapseSidenav(): void {
    this._userService
      .patchCurrentUserSettings({
        collapseSidenav: this.showSidenav,
      })
      .pipe(take(1))
      .subscribe(_ => this._onSettingsChange.next());
  }
}
