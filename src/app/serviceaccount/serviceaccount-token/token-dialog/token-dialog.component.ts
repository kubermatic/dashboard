import {Component, Input} from '@angular/core';
import {ServiceAccountTokenEntity} from '../../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})

export class TokenDialogComponent {
  @Input() serviceaccountToken: ServiceAccountTokenEntity;

  constructor() {}
}
