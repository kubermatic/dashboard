import { Injectable } from '@angular/core';
import { MatDrawerToggleResult, MatSidenav } from '@angular/material';

@Injectable()
export class SidenavService {

  public sidenav: MatSidenav;

  constructor() { }

  public setSidenav(sidenav: MatSidenav): void {
    this.sidenav = sidenav;
  }

  public open(): Promise<MatDrawerToggleResult> {
    return this.sidenav.open();
  }

  public close(): Promise<MatDrawerToggleResult>|void {
    if (this.sidenav) {
      return this.sidenav.close();
    }
  }

  public toggle(isOpen?: boolean): Promise<MatDrawerToggleResult> {
    return this.sidenav.toggle(isOpen);
  }

}
