import {Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss'],
})
export class FrontpageComponent implements OnInit {
  constructor(
      private readonly _auth: Auth, private readonly _router: Router, private readonly _cookieService: CookieService) {}

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent): void {
    // keyCode = 13 is enter
    if (event.keyCode === 13) {
      this.goToLogin();
    }
  }

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._router.navigate(['/projects']);
    }

    const nonceRegExp = /&nonce=(.*)$/;
    const nonceStr = nonceRegExp.exec(this._auth.getOIDCProviderURL());
    if (!!nonceStr && nonceStr.length >= 2 && !!nonceStr[1]) {
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, '/', null, true);
      // localhost is only served via http, though secure cookie is not possible
      // following line will only work when domain is localhost
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, '/', 'localhost');
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, '/', '127.0.0.1');
    }
  }

  goToLogin(): void {
    document.getElementById('login-button').click();
  }

  getOIDCProviderURL(): string {
    return this._auth.getOIDCProviderURL();
  }

  login(): void {
    this._auth.login();
  }
}
