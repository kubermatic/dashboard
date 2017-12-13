import { Component, OnInit } from '@angular/core';
import {MdDialogRef} from '@angular/material';

@Component({
  selector: 'kubermatic-mobile-navigation',
  templateUrl: './mobile-navigation.component.html',
  styleUrls: ['./mobile-navigation.component.scss']
})
export class MobileNavigationComponent {

  constructor(
    private dialogRef: MdDialogRef<MobileNavigationComponent>
  ) {}

  public closeModal(): void {
    this.dialogRef.close();
  }
}
