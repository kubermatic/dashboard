import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';

import {NotificationService} from '../../../../core/services';
import {SettingsService} from '../../../../core/services/settings/settings.service';
import {AdminEntity} from '../../../../shared/entity/AdminSettings';

@Component({
  selector: 'km-add-admin-dialog',
  templateUrl: './add-admin-dialog.component.html',
  styleUrls: ['./add-admin-dialog.component.scss'],
})
export class AddAdminDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _matDialogRef: MatDialogRef<AddAdminDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required]),
    });
  }

  addProject(): void {
    const adminEntity: AdminEntity = {
      email: this.form.controls.email.value,
      isAdmin: true,
    };

    this._settingsService.setAdmin(adminEntity).subscribe(admin => {
      this._notificationService.success(
        `The <strong>${admin.name}</strong> user was successfully added to admin group`
      );
      this._matDialogRef.close(admin);
    });
  }
}
