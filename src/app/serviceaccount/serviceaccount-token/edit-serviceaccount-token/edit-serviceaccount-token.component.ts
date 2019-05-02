import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {first} from 'rxjs/operators';

import {ApiService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {ServiceAccountEntity, ServiceAccountTokenEntity, ServiceAccountTokenPatch} from '../../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-edit-serviceaccount-token',
  templateUrl: './edit-serviceaccount-token.component.html',
})

export class EditServiceAccountTokenComponent implements OnInit {
  @Input() project: ProjectEntity;
  @Input() serviceaccount: ServiceAccountEntity;
  @Input() token: ServiceAccountTokenEntity;
  editServiceAccountTokenForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService,
      private readonly _matDialogRef: MatDialogRef<EditServiceAccountTokenComponent>) {}

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
          NotificationActions.success('Success', `Token ${this.token.name} is edited successfully`);
        });
  }
}
