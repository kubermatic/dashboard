import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material';

@Component({
  selector: 'kubermatic-mobile-navigation',
  templateUrl: './mobile-navigation.component.html',
  styleUrls: ['./mobile-navigation.component.scss'],
})
export class MobileNavigationComponent {
  constructor(private dialogRef: MatDialogRef<MobileNavigationComponent>) {}

  closeModal(): void {
    this.dialogRef.close();
  }
}
