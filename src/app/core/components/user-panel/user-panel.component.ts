import {Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {slideOut} from '../../../shared/animations/slide';
import {Auth, UserService} from '../../services';
import {Router} from '@angular/router';
import {SettingsService} from '../../services/settings/settings.service';
import {Member} from '../../../shared/entity/member';

@Component({
  selector: 'km-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  animations: [slideOut],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  user: Member;
  private _isOpen = false;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _router: Router,
    private readonly _auth: Auth,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.loggedInUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.user = user));
    }
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
    this._auth.logout();
    this._settingsService.refreshCustomLinks();
    this._router.navigate(['']);
    this._isOpen = false;
    delete this.user;
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
