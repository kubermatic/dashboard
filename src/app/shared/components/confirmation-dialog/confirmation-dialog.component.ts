import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface ConfirmationDialogConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  constructor(
      public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onEnterKeyDown(): void {
    this.dialogRef.close(true);
  }
}
