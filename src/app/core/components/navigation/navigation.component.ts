import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {Auth, ProjectService, UserService} from '../../services';

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  isScrolled = false;
  environment: any = environment;
  currentUser: MemberEntity;

  constructor(
      public auth: Auth, private router: Router, private userService: UserService,
      private projectService: ProjectService) {}

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this.userService.loggedInUser.subscribe(user => this.currentUser = user);
    }
  }

  logout(): void {
    this.router.navigate(['']);
    this.auth.logout();
    this.projectService.deselectProject();
    delete this.currentUser;
  }

  scrolledChanged(isScrolled): void {
    this.isScrolled = isScrolled;
  }
}
