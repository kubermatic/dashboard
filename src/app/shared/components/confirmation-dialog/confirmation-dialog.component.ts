import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface ConfirmationDialogConfig {
  dialogId: string;
  title: string;
  message: string;
  confirmLabel: string;
  confirmLabelId: string;
  cancelLabel: string;
  cancelLabelId: string;
  verifyName: boolean;
  // following fields only required, if dialog should have an input field for verification
  compareName?: string;
  inputId?: string;
  inputPlaceholder?: string;
  inputTitle?: string;
}

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  inputName = '';

  constructor(
      public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onEnterKeyDown(): void {
    this.dialogRef.close(true);
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    if (!!this.data.verifyName) {
      return this.inputName === this.data.compareName;
    }
    return true;
  }
}
