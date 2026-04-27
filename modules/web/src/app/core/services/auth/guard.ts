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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {MemberUtils, Permission} from '@shared/utils/member';
import {from, Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {UserService} from '../user';
import {Auth} from './service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly _userService: UserService,
    private readonly _router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this._userService.currentUser.pipe(
      map(user => (user.isAdmin ? true : this._router.parseUrl(View.Projects)))
    );
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth) {}

  canActivate(_route: ActivatedRouteSnapshot, _snap: RouterStateSnapshot): boolean {
    if (this.auth.authenticated()) {
      return true;
    }

    window.location.href = this.auth.getOIDCProviderURL();
    return false;
  }
}

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(
    private readonly _userService: UserService,
    private readonly _router: Router
  ) {}

  canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const projectID = this._getProjectID(state.url);
    const view = this._getView(state.url);
    let currentUser: Member;
    this._userService.currentUser.subscribe(user => (currentUser = user));

    return this._userService
      .getCurrentUserGroup(projectID)
      .pipe(map(userGroup => this._userService.getCurrentUserGroupConfig(userGroup)))
      .pipe(
        map(groupConfig => {
          if (!MemberUtils.hasPermission(currentUser, groupConfig, view, Permission.View)) {
            this._router.navigate([View.Projects]);
            return false;
          }

          return true;
        })
      )
      .pipe(catchError(_ => this._navigateToProjects()));
  }

  private _getView(url: string): View {
    const view = url
      .split('/')
      .reverse()
      .find(partial => Object.values(View).find(view => view === partial));

    return view !== undefined ? (view as View) : View.Projects;
  }

  // Extracts project id from the URL. Guards are only set for the views that require selected project.
  private _getProjectID(url: string): string {
    let parts: string[];
    const projectsIdx = url.indexOf(View.Projects);
    return projectsIdx > -1
      ? (parts = url.substring(projectsIdx).split('/')).length > 1
        ? parts[1]
        : undefined
      : undefined;
  }

  private _navigateToProjects(): Observable<boolean> {
    return from(this._router.navigate([View.Projects]));
  }
}
