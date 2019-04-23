import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material';
import {first} from 'rxjs/operators';

import {ApiService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {CreateTokenEntity, ServiceAccountEntity, ServiceAccountTokenEntity} from '../../../shared/entity/ServiceAccountEntity';
import {TokenDialogComponent} from '../token-dialog/token-dialog.component';

@Component({
  selector: 'kubermatic-add-serviceaccount-token',
  templateUrl: './add-serviceaccount-token.component.html',
})
export class AddServiceAccountTokenComponent implements OnInit {
  @Input() project: ProjectEntity;
  @Input() serviceaccount: ServiceAccountEntity;
  addServiceAccountTokenForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService, private readonly _matDialog: MatDialog,
      private readonly _matDialogRef: MatDialogRef<AddServiceAccountTokenComponent>) {}

  ngOnInit(): void {
    this.addServiceAccountTokenForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  addServiceAccountToken(): void {
    const createServiceAccountToken: CreateTokenEntity = {
      name: this.addServiceAccountTokenForm.controls.name.value,
    };

    this._apiService.createServiceAccountToken(this.project.id, this.serviceaccount, createServiceAccountToken)
        .pipe(first())
        .subscribe((token) => {
          this._matDialogRef.close(true);
          NotificationActions.success(
              'Success',
              `Token ${createServiceAccountToken.name} is added successfully to service account ${
                  this.serviceaccount.name}`);
          this.openTokenDialog(token);
        });
  }

  openTokenDialog(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
  }
}
