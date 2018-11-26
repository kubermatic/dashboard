import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {MobileNavigationComponent} from '../../../overlays';
import {AppConstants} from '../../../shared/constants/constants';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {Auth, ProjectService, UserService} from '../../services';
import {SidenavService} from '../sidenav/sidenav.service';

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
      public auth: Auth, private sidenavService: SidenavService, private router: Router, private dialog: MatDialog,
      private userService: UserService, private projectService: ProjectService) {}

  ngOnInit(): void {
    if (window.innerWidth < AppConstants.MOBILE_RESOLUTION_BREAKPOINT) {
      this.sidenavService.close();
    }

    if (this.auth.authenticated()) {
      this.userService.getUser().subscribe((user) => {
        this.currentUser = user;
      });
    }
  }

  logout(): void {
    this.router.navigate(['']);
    this.auth.logout();
    this.projectService.removeProject();
  }

  scrolledChanged(isScrolled): void {
    this.isScrolled = isScrolled;
  }

  onResize(event): void {
    if (event.target.innerWidth < AppConstants.MOBILE_RESOLUTION_BREAKPOINT) {
      this.sidenavService.close();
    }
  }

  showMobileNav(): void {
    this.dialog.open(MobileNavigationComponent);
  }
}
