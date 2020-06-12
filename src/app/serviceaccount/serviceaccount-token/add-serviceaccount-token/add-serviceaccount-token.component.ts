import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {ApiService, NotificationService} from '../../../core/services';
import {Project} from '../../../shared/entity/project';
import {CreateTokenEntity, ServiceAccount, ServiceAccountTokenEntity} from '../../../shared/entity/service-account';
import {TokenDialogComponent} from '../token-dialog/token-dialog.component';

@Component({
  selector: 'km-add-serviceaccount-token',
  templateUrl: './add-serviceaccount-token.component.html',
})
export class AddServiceAccountTokenComponent implements OnInit {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  addServiceAccountTokenForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialog: MatDialog,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountTokenComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addServiceAccountTokenForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  addServiceAccountToken(): void {
    const createServiceAccountToken: CreateTokenEntity = {
      name: this.addServiceAccountTokenForm.controls.name.value,
    };

    this._apiService
      .createServiceAccountToken(this.project.id, this.serviceaccount, createServiceAccountToken)
      .pipe(first())
      .subscribe(token => {
        this._matDialogRef.close(true);
        this._notificationService.success(
          `The <strong>${createServiceAccountToken.name}</strong> token was added to the <strong>${this.serviceaccount.name}</strong> service account`
        );
        this.openTokenDialog(token);
      });
  }

  openTokenDialog(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
    modal.componentInstance.projectID = this.project.id;
  }
}
