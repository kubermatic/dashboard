import { Injectable } from '@angular/core';
import { MatSidenav } from '@angular/material';

@Injectable()
export class SidenavService {

  constructor() { }

  public sidenav: MatSidenav;

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public open(): Promise<void> {
    return this.sidenav.open();
  }

  public close(): Promise<void> {
    if (this.sidenav) {
      return this.sidenav.close();
    }
  }

  public toggle(isOpen?: boolean): Promise<void> {
    return this.sidenav.toggle(isOpen);
  }

}
