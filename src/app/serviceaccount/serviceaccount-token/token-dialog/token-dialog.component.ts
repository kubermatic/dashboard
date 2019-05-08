import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material';

import {ServiceAccountTokenEntity} from '../../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})

export class TokenDialogComponent {
  @Input() serviceaccountToken: ServiceAccountTokenEntity;

  constructor(public dialogRef: MatDialogRef<TokenDialogComponent>) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
