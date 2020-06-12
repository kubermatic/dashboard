import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {ApiService, NotificationService} from '../../../core/services';
import {Project} from '../../../shared/entity/project';
import {ServiceAccount, ServiceAccountToken, ServiceAccountTokenPatch} from '../../../shared/entity/service-account';

@Component({
  selector: 'km-edit-serviceaccount-token',
  templateUrl: './edit-serviceaccount-token.component.html',
})
export class EditServiceAccountTokenComponent implements OnInit {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  @Input() token: ServiceAccountToken;
  editServiceAccountTokenForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<EditServiceAccountTokenComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.editServiceAccountTokenForm = new FormGroup({
      name: new FormControl(this.token.name, [Validators.required]),
    });
  }

  editServiceAccountToken(): void {
    const patchServiceAccountToken: ServiceAccountTokenPatch = {
      name: this.editServiceAccountTokenForm.controls.name.value,
    };

    this._apiService
      .patchServiceAccountToken(this.project.id, this.serviceaccount, this.token, patchServiceAccountToken)
      .pipe(first())
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The <strong>${this.token.name}</strong> token was updated`);
      });
  }
}
