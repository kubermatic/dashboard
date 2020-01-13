import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.scss'],
})
export class TermsOfServiceComponent {
  constructor(private readonly _auth: Auth, private readonly _router: Router) {}

  backToApp(): void {
    if (this._auth.authenticated()) {
      this._router.navigate(['/projects']);
    } else {
      this._router.navigate(['']);
    }
  }
}
