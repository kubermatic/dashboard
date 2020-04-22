import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Auth} from '../../core/services';

@Component({
  selector: 'km-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
})
export class PageNotFoundComponent {
  constructor(private auth: Auth, private router: Router) {}

  backToApp(): void {
    if (this.auth.authenticated()) {
      this.router.navigate(['/projects']);
    } else {
      this.router.navigate(['']);
    }
  }
}
