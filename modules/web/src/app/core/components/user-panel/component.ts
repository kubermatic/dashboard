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

import {DOCUMENT} from '@angular/common';
import {Component, ElementRef, HostListener, Inject, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {slideOut} from '@shared/animations/slide';
import {Member} from '@shared/entity/member';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-user-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [slideOut],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  user: Member;
  private _isOpen = false;
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _router: Router,
    private readonly _auth: Auth,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _appConfigService: AppConfigService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.user = user));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen()) {
      this.close();
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  close(): void {
    this._isOpen = false;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
  }

  logout(): void {
    const token = this._auth.getBearerToken();
    this._auth.logout().subscribe(_ => {
      this._settingsService.refreshCustomLinks();
      if (this._appConfigService.getConfig().oidc_logout_url) {
        this._auth.oidcProviderLogout(token);
      } else {
        this._router.navigate(['']);
        this._document.defaultView.location.reload();
        this._isOpen = false;
        delete this.user;
      }
    });
  }

  login(): void {
    this._auth.login();
  }

  goToAccount(): void {
    this._router.navigate(['account']);
    this._isOpen = false;
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated();
  }

  isAdminPanelVisible(): boolean {
    return !!this.user && this.user.isAdmin;
  }

  goToAdminPanel(): void {
    this._router.navigate(['settings']);
    this._isOpen = false;
  }
}
