import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {NotificationService} from '../../core/services';
import {ApiService} from '../../core/services';
import {Project} from '../../shared/entity/project';
import {ServiceAccount} from '../../shared/entity/service-account';

@Component({
  selector: 'km-edit-serviceaccount',
  templateUrl: './edit-serviceaccount.component.html',
})
export class EditServiceAccountComponent implements OnInit {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  editServiceAccountForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<EditServiceAccountComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.editServiceAccountForm = new FormGroup({
      name: new FormControl(this.serviceaccount.name, [Validators.required]),
      group: new FormControl(this.serviceaccount.group.replace(/(-[\w\d]+$)/, ''), [Validators.required]),
    });
  }

  editServiceAccount(): void {
    const editServiceAccount: ServiceAccount = {
      id: this.serviceaccount.id,
      name: this.editServiceAccountForm.controls.name.value,
      creationTimestamp: this.serviceaccount.creationTimestamp,
      deletionTimestamp: this.serviceaccount.deletionTimestamp,
      group: this.editServiceAccountForm.controls.group.value,
      status: this.serviceaccount.id,
    };

    this._apiService
      .editServiceAccount(this.project.id, editServiceAccount)
      .pipe(first())
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(
          `The <strong>${this.serviceaccount.name}</strong> service account was updated`
        );
      });
  }
}
