import { CheckboxField } from './shared/model/dynamic-forms/field-checkbox';

import { Component, OnInit, ViewChild } from "@angular/core";

import { MdSidenav } from '@angular/material';
import { SidenavService } from './core/components/sidenav/sidenav.service';
import { DropdownField } from './shared/model/dynamic-forms/field-dropdown';
import { TextboxField } from './shared/model/dynamic-forms/field-textbox';

@Component({
  selector: "kubermatic-root",
  templateUrl: "./kubermatic.component.html",
  styleUrls: ["./kubermatic.component.scss"]
})
export class KubermaticComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MdSidenav;

  public constructor(
    private sidenavService: SidenavService
  ) {}

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
