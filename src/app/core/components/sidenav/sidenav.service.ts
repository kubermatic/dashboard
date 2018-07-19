import { Injectable } from '@angular/core';
import { MatSidenav } from '@angular/material';

@Injectable()
export class SidenavService {

  public sidenav: MatSidenav;

  constructor() { }

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public open() {
    return this.sidenav.open();
  }

  public close() {
    if (this.sidenav) {
      return this.sidenav.close();
    }
  }

  public toggle(isOpen?: boolean) {
    return this.sidenav.toggle(isOpen);
  }

}
