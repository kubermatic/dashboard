import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export interface ConfirmationDialogConfig {
  title: string;
  message: string;
  confirmLabel: string;
  // Following field is required only if dialog should have an warning message with an icon.
  warning?: string;
  // Following fields are required only if dialog should have an input field for verification.
  compareName?: string;
  inputPlaceholder?: string;
  inputTitle?: string;
}

@Component({
  selector: 'km-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  inputName = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onEnterKeyDown(): void {
    if (!this.inputNameMatches()) {
      return;
    }
    this.dialogRef.close(true);
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    if (!!this.data.compareName && this.data.compareName.length > 0) {
      return this.inputName === this.data.compareName;
    }
    return true;
  }
}
