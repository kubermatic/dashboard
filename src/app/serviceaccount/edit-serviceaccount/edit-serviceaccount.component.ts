import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';

import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {ServiceAccountEntity} from '../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-edit-serviceaccount',
  templateUrl: './edit-serviceaccount.component.html',
})

export class EditServiceAccountComponent implements OnInit {
  @Input() project: ProjectEntity;
  @Input() serviceaccount: ServiceAccountEntity;
  editServiceAccountForm: FormGroup;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<EditServiceAccountComponent>) {}

  ngOnInit(): void {
    this.editServiceAccountForm = new FormGroup({
      name: new FormControl(this.serviceaccount.name, [Validators.required]),
      group: new FormControl(this.serviceaccount.group.replace(/(\-[\w\d]+$)/, ''), [Validators.required]),
    });
  }

  editServiceAccount(): void {
    const editServiceAccount: ServiceAccountEntity = {
      id: this.serviceaccount.id,
      name: this.editServiceAccountForm.controls.name.value,
      creationTimestamp: this.serviceaccount.creationTimestamp,
      deletionTimestamp: this.serviceaccount.deletionTimestamp,
      group: this.editServiceAccountForm.controls.group.value,
      status: this.serviceaccount.id,
    };

    this.api.editServiceAccounts(this.project.id, editServiceAccount).subscribe((res) => {
      this.dialogRef.close(true);
      NotificationActions.success('Success', `Service Account ${this.serviceaccount.name} is edited successfully`);
    });
  }
}
