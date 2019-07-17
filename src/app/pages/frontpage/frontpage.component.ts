import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss'],
})
export class FrontpageComponent implements OnInit, AfterViewInit {
  myStyle: object = {
    'position': 'fixed',
    'width': '100%',
    'height': '100%',
    'z-index': 0,
    'top': 0,
    'left': 0,
    'right': 0,
    'bottom': 0,
  };

  myParams: object = {
    particles: {
      number: {
        value: 80,
      },
      color: {
        value: '#fff',
      },
      shape: {
        type: 'circle',
      },
    },
  };

  isInitialized = false;

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
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, null, null, true);
      // localhost is only served via http, though secure cookie is not possible
      // following line will only work when domain is localhost
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, null, 'localhost');
      this._cookieService.set(Auth.Cookie.Nonce, nonceStr[1], null, null, '127.0.0.1');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Displaying of particles has to be delayed to avoid race condition and component crash.
      // It was introduced after APP_INITIALIZER was added to the ApiService.
      this.isInitialized = true;
    });
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
