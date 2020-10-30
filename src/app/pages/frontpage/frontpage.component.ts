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

import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {Router} from '@angular/router';
import {Auth} from '@core/services/auth/service';

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
