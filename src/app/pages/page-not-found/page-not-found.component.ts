import { Component } from '@angular/core';
import { Auth } from '../../core/services';
import { Router } from '@angular/router';

@Component({
  selector: 'kubermatic-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent {
  constructor(
    private auth: Auth,
    private router: Router
  ) { }

  backToApp(): void {
    if (this.auth.authenticated()) {
      this.router.navigate(['clusters']);
    } else {
      this.router.navigate(['']);
    }
  }
}
