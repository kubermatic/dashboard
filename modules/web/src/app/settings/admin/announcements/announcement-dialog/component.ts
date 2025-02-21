// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {NotificationService} from '@app/core/services/notification';
import {SettingsService} from '@app/core/services/settings';
import {AdminAnnouncement, AdminSettings} from '@app/shared/entity/settings';
import {Observable, of, Subject, takeUntil} from 'rxjs';

export interface AdminAnnouncementDialogConfig {
  announcement: AdminAnnouncement;
  id: string;
}

export enum Controls {
  Message = 'message',
  IsActive = 'isActive',
  ExpireDate = 'expireDate',
  ExpireTime = 'expireTime',
}

@Component({
    selector: 'km-admin-announcement-dialog',
    templateUrl: 'template.html',
    styleUrls: ['./style.scss'],
    providers: [provideNativeDateAdapter()],
    standalone: false
})
export class AdminAnnouncementDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _defaultExpireTime = '00:00';
  Controls = Controls;
  form: FormGroup;
  isEditDialog: boolean = false;
  minDate = new Date();
  expiresDate: Date;

  constructor(
    public _matDialogRef: MatDialogRef<AdminAnnouncementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _data: AdminAnnouncementDialogConfig,
    private readonly _dialogModeService: DialogModeService,
    private readonly _dialogRef: MatDialogRef<AdminAnnouncementDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  get dialogTitle(): string {
    return this._dialogModeService.isEditDialog ? 'Edit Announcement' : 'Add Announcement';
  }

  get label(): string {
    return this._dialogModeService.isEditDialog ? 'Save Changes' : 'Add Announcement';
  }

  get icon(): string {
    return this.isEditDialog ? 'km-icon-save' : 'km-icon-add';
  }

  ngOnInit(): void {
    this.isEditDialog = this._dialogModeService.isEditDialog;
    this.form = new FormGroup({
      [Controls.Message]: new FormControl(this._data?.announcement?.message ?? '', [Validators.required]),
      [Controls.IsActive]: new FormControl(this._data?.announcement?.isActive ?? true),
      [Controls.ExpireDate]: new FormControl(
        this._data?.announcement?.expires ? new Date(this._data?.announcement?.expires) : ''
      ),
      [Controls.ExpireTime]: new FormControl(
        this._data?.announcement?.expires
          ? new Date(this._data.announcement.expires).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : ''
      ),
    });
    if (!this._data?.announcement?.expires) {
      this.form.get(Controls.ExpireTime).disable();
    }

    if (this._data?.announcement?.expires) {
      this.expiresDate = new Date(this._data?.announcement.expires);
    }

    this.form
      .get(Controls.ExpireDate)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(date => {
        const expierTime = this.form.get(Controls.ExpireTime);
        this.expiresDate = date;
        if (!date) {
          expierTime.setValue('');
          expierTime.disable();
          return;
        }
        this.form.get(Controls.ExpireTime).enable();
        this.form.get(Controls.ExpireTime).setValue(this._defaultExpireTime);
      });

    this.form
      .get(Controls.ExpireTime)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((time: string) => {
        this.onTimeChange(time);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<AdminSettings> {
    if (!this.form) {
      return of({} as AdminSettings);
    }
    const announcement: AdminAnnouncement = {
      message: this.form.get(Controls.Message).value,
      isActive: this.form.get(Controls.IsActive).value,
      expires: this.expiresDate ? this.expiresDate.toISOString() : null,
    };
    const adminSettings: AdminSettings = {} as AdminSettings;
    if (this._data?.id) {
      adminSettings.announcements = {
        [this._data.id]: announcement,
      };
    } else {
      adminSettings.announcements = {
        newAnnouncement: announcement,
      };
    }
    return this._settingsService.patchAdminSettings(adminSettings);
  }

  onNext(announcement: AdminAnnouncement): void {
    this._dialogRef.close(announcement);
    this._notificationService.success(
      this.isEditDialog ? 'Announcement updated successfully.' : 'New announcement created successfully.'
    );
  }

  onTimeChange(time: string): void {
    const [hours, minutes] = time.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      this.expiresDate.setHours(hours, minutes, 0, 0);
    }
  }
}
