import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {from, Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';
import {UserService} from '../user/user.service';

import {Auth} from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.authenticated()) {
      return true;
    }

    window.location.href = this.auth.getOIDCProviderURL();
    return false;
  }
}

export enum View {
  Clusters = 'clusters',
  Projects = 'projects',
  Members = 'members',
  SSHKeys = 'sshKeys',
  ServiceAccounts = 'serviceaccounts',
}

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(private readonly _userService: UserService, private readonly _router: Router) {}

  canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const projectID = this._getProjectID(state.url);
    const view = this._getView(state.url);
    let currentUser: MemberEntity;
    this._userService.loggedInUser.subscribe(user => currentUser = user);

    return this._userService.currentUserGroup(projectID)
        .pipe(map(userGroup => this._userService.userGroupConfig(userGroup)))
        .pipe(map(groupConfig => {
          if (!MemberUtils.hasPermission(currentUser, groupConfig, view, Permission.View)) {
            this._router.navigate([View.Projects]);
            return false;
          }

          return true;
        }))
        .pipe(catchError(_ => this._navigateToProjects()));
  }

  private _getView(url: string): View {
    const view = url.split('/').reverse().find(partial => {
      return Object.values(View).find(view => view === partial);
    });

    return view !== undefined ? view as View : View.Projects;
  }

  // Extracts project id from the URL. Guards are only set for the views that require selected project.
  private _getProjectID(url: string): string {
    let parts: string[];
    const projectsIdx = url.indexOf(View.Projects);
    return projectsIdx > -1 ? (parts = url.substring(projectsIdx).split('/')).length > 1 ? parts[1] : undefined :
                              undefined;
  }

  private _navigateToProjects(): Observable<boolean> {
    return from(this._router.navigate([View.Projects]));
  }
}
