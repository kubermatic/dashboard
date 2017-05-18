import { Injectable } from '@angular/core';
import { MdSidenav, MdSidenavToggleResult } from '@angular/material';

@Injectable()
export class SidenavService {

  constructor() { }

  public sidenav: MdSidenav;

  public setSidenav(sidenav: MdSidenav) {
    this.sidenav = sidenav;
  }

  public open(): Promise<MdSidenavToggleResult> {
    return this.sidenav.open();
  }

  public close(): Promise<MdSidenavToggleResult> {
    debugger;
    return this.sidenav.close();
  }

  public toggle(isOpen?: boolean): Promise<MdSidenavToggleResult> {
    return this.sidenav.toggle(isOpen);
  }

}
