import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {Router} from '@angular/router';
import {Auth} from '../../core/services';

@Component({
  selector: 'km-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss'],
})
export class FrontpageComponent implements OnInit {
  @ViewChild('loginButton') private readonly _loginButton: MatAnchor;

  constructor(private readonly _auth: Auth, private readonly _router: Router) {}

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this._loginButton._elementRef.nativeElement.click();
    }
  }

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._router.navigate(['/projects']);
    }

    this._auth.setNonce();
  }

  getOIDCProviderURL(): string {
    return this._auth.getOIDCProviderURL();
  }

  login(): void {
    this._auth.login();
  }
}
