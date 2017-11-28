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
  public fields: any[];

  public constructor(
    private sidenavService: SidenavService
  ) {
    this.fields = [
      new DropdownField({
        key: 'brave',
        placeholder: 'Bravery Rating',
        options: [
          { key: 'solid', value: 'Solid' },
          { key: 'great', value: 'Great' },
          { key: 'good', value: 'Good' },
          { key: 'unproven', value: 'Unproven' }
        ],
        order: 3
      }),

      new TextboxField({
        key: 'firstName',
        placeholder: 'First name',
        value: 'Bombasto',
        required: true,
        maxLength: 10,
        minLength: 5,
        order: 1
      }),

      new CheckboxField({
        key: 'awsCas',
        placeholder: 'Extend Provider settings',
        value: false,
        order: 4
      }),

      new TextboxField({
        key: 'emailAddress',
        placeholder: 'Email',
        type: 'email',
        order: 2
      }),

      new TextboxField({
        key: 'number',
        placeholder: 'Number',
        type: 'number',
        minNumber: 1,
        order: 5
      })
    ];
  }

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
