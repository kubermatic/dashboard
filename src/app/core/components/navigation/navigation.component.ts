import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {Auth, UserService} from '../../services';
import {SettingsService} from '../../services/settings/settings.service';

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  @Input() showCollapseIcon: boolean;
  currentUser: MemberEntity;
  showSidenav = true;
  private _settingsChange = new Subject<void>();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _auth: Auth, private readonly _router: Router, private readonly _userService: UserService,
      private _settingsService: SettingsService) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.loggedInUser.subscribe(user => this.currentUser = user);
    }

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.showSidenav = !settings.collapseSidenav;
    });

    this._settingsChange.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._settingsService.patchUserSettings({'collapseSidenav': !this.showSidenav})))
        .subscribe(settings => {
          this._settingsService.refreshUserSettings();
          this.showSidenav = !settings.collapseSidenav;
        });
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated();
  }

  logout(): void {
    this._auth.logout();
    this._router.navigate(['']);
    delete this.currentUser;
  }

  login(): void {
    this._auth.login();
  }

  getOIDCProviderURL(): string {
    return this._auth.getOIDCProviderURL();
  }

  goToAccount(): void {
    this._router.navigate(['account']);
  }

  isAdminPanelVisible(): boolean {
    return !!this.currentUser && this.currentUser.isAdmin;
  }

  goToAdminPanel(): void {
    this._router.navigate(['settings']);
  }

  collapseSidenav(): void {
    this.showSidenav = !this.showSidenav;
    this._settingsChange.next();
  }
}
