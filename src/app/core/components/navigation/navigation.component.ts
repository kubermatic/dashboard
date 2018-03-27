import {Component, OnInit} from '@angular/core';
import { MatDialog } from '@angular/material';

import {Auth} from '../../services';
import {SidenavService} from '../sidenav/sidenav.service';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {AppConstants} from '../../../shared/constants/constants';
import { MobileNavigationComponent } from '../../../overlays';

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  public isScrolled = false;
  public environment: any = environment;

  constructor(
    public auth: Auth,
    private sidenavService: SidenavService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (window.innerWidth < AppConstants.MOBILE_RESOLUTION_BREAKPOINT) {
      this.sidenavService.close();
    }
  }

  public logout() {
    this.router.navigate(['']);
    this.auth.logout();
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
