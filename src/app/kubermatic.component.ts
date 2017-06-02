import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Component, ViewChild } from "@angular/core";
import { MdSidenav } from '@angular/material';
import { SidenavService } from './sidenav/sidenav.service';

@Component({
  selector: "kubermatic-root",
  templateUrl: "./kubermatic.component.html",
  styleUrls: ["./kubermatic.component.scss"]
})
export class KubermaticComponent {
  @ViewChild('sidenav') public sidenav: MdSidenav;

  public constructor(
    private sidenavService: SidenavService
  ) {}

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
