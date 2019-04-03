import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';

import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {CreateServiceAccountEntity} from '../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-add-serviceaccount',
  templateUrl: './add-serviceaccount.component.html',
})
export class AddServiceAccountComponent implements OnInit {
  @Input() project: ProjectEntity;
  addServiceAccountForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService,
      private readonly _matDialogRef: MatDialogRef<AddServiceAccountComponent>) {}

  ngOnInit(): void {
    this.addServiceAccountForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      group: new FormControl('', [Validators.required]),
    });
  }

  addServiceAccount(): void {
    const createServiceAccount: CreateServiceAccountEntity = {
      name: this.addServiceAccountForm.controls.name.value,
      group: this.addServiceAccountForm.controls.group.value,
    };

    this._apiService.createServiceAccounts(this.project.id, createServiceAccount).subscribe(() => {
      this._matDialogRef.close(true);
      NotificationActions.success(
          'Success',
          `Service Account ${createServiceAccount.name} is added successfully to project ${this.project.name}`);
    });
  }
}
