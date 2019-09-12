import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {Auth, UserService} from '../../services';

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  currentUser: MemberEntity;

  constructor(
      private readonly _auth: Auth, private readonly _router: Router, private readonly _userService: UserService) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.loggedInUser.subscribe(user => this.currentUser = user);
    }
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
}
