import {Injectable} from '@angular/core';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material';

@Injectable()
export class SidenavService {
  sidenav: MatSidenav;

  constructor() {}

  setSidenav(sidenav: MatSidenav): void {
    this.sidenav = sidenav;
  }

  open(): Promise<MatDrawerToggleResult> {
    return this.sidenav.open();
  }

  close(): Promise<MatDrawerToggleResult>|void {
    if (this.sidenav) {
      return this.sidenav.close();
    }
  }

  toggle(isOpen?: boolean): Promise<MatDrawerToggleResult> {
    return this.sidenav.toggle(isOpen);
  }
}
