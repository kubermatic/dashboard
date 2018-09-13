import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Auth, UserService, ProjectService } from '../../services';
import { SidenavService } from '../sidenav/sidenav.service';
import { environment } from '../../../../environments/environment';
import { AppConstants } from '../../../shared/constants/constants';
import { MobileNavigationComponent } from '../../../overlays';
import { MemberEntity } from '../../../shared/entity/MemberEntity';
import {Subscription} from 'rxjs/index';


@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  public isScrolled = false;
  public environment: any = environment;
  public currentUser: MemberEntity;

  constructor(public auth: Auth,
              private sidenavService: SidenavService,
              private router: Router,
              private dialog: MatDialog,
              private userService: UserService,
              private projectService: ProjectService) {}

  ngOnInit(): void {
    if (window.innerWidth < AppConstants.MOBILE_RESOLUTION_BREAKPOINT) {
      this.sidenavService.close();
    }

    if (this.auth.authenticated()) {
      this.userService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }
  }

  public logout() {
    this.router.navigate(['']);
    this.auth.logout();
    this.projectService.removeProject();
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }

  public toggleSidenav() {
    this.sidenavService
      .toggle()
      .then(() => { });
  }

  public onResize(event): void {
    if (event.target.innerWidth < AppConstants.MOBILE_RESOLUTION_BREAKPOINT) {
      this.sidenavService.close();
    }
  }

  public showMobileNav(): void {
    this.dialog.open(MobileNavigationComponent);
  }
}
