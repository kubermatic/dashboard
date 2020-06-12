import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {NotificationService} from '../../core/services';
import {ApiService} from '../../core/services';
import {Project} from '../../shared/entity/project';
import {ServiceAccountModel} from '../../shared/entity/service-account';

@Component({
  selector: 'km-add-serviceaccount',
  templateUrl: './add-serviceaccount.component.html',
})
export class AddServiceAccountComponent implements OnInit {
  @Input() project: Project;
  addServiceAccountForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addServiceAccountForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      group: new FormControl('editors', [Validators.required]),
    });
  }

  addServiceAccount(): void {
    const createServiceAccount: ServiceAccountModel = {
      name: this.addServiceAccountForm.controls.name.value,
      group: this.addServiceAccountForm.controls.group.value,
    };

    this._apiService
      .createServiceAccount(this.project.id, createServiceAccount)
      .pipe(first())
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(
          `The <strong>${createServiceAccount.name}</strong> service account was added to the <strong>${this.project.name}</strong> project`
        );
      });
  }
}
