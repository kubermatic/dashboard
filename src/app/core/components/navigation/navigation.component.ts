import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {Auth, UserService} from '../../services';

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  isScrolled = false;
  environment: any = environment;
  currentUser: MemberEntity;

  constructor(public auth: Auth, private readonly _router: Router, private readonly _userService: UserService) {}

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this._userService.loggedInUser.subscribe(user => this.currentUser = user);
    }
  }

  logout(): void {
    this.auth.logout();
    this._router.navigate(['']);
    delete this.currentUser;
  }

  scrolledChanged(isScrolled): void {
    this.isScrolled = isScrolled;
  }
}
