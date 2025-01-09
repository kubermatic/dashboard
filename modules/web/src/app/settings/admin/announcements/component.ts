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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {AdminAnnouncementDialogComponent, AdminAnnouncementDialogConfig} from './announcement-dialog/component';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {take, takeUntil} from 'rxjs/operators';
import {AdminAnnouncement, AdminSettings} from '@app/shared/entity/settings';
import {StatusIcon} from '@app/shared/utils/health-status';
import {Subject} from 'rxjs';
import {SettingsService} from '@app/core/services/settings';

enum Column {
  Status = 'status',
  Message = 'message',
  Expires = 'expires',
  CreatedAt = 'createdAt',
  Actions = 'actions',
}

interface AdminAnnouncementStatus {
  message: string;
  icon: StatusIcon;
}

@Component({
  selector: 'km-admin-announcements',
  templateUrl: 'template.html',
  styleUrl: 'style.scss',
})
export class AdminAnnouncementsComponent implements OnInit, OnDestroy {
  readonly Column = Column;
  private _unsubscribe = new Subject<void>();
  adminSettings: AdminSettings;
  dataSource = new MatTableDataSource<string>();
  displayedColumns: string[] = Object.values(Column);
  announcements = new Map<string, AdminAnnouncement>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.adminSettings = settings;
      this._initAnnouncements(settings.announcements);
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  removeAnnouncement(announcementID: string): void {
    this.announcements.set(announcementID, null);
    this._settingsService
      .patchAdminSettings({announcements: this.announcements} as AdminSettings)
      .subscribe(settings => {
        this._initAnnouncements(settings.announcements);
      });
  }

  getStatus(announcementID: string): AdminAnnouncementStatus {
    const announcement = this.announcements.get(announcementID);
    if (new Date(announcement?.expires) < new Date()) {
      return {message: 'Expired', icon: StatusIcon.Unknown};
    }
    if (!announcement?.isActive) {
      return {message: 'Paused', icon: StatusIcon.Stopped};
    }
    return {message: 'Active', icon: StatusIcon.Running};
  }

  addAnnouncementDialog(announcementID?: string): void {
    let config: AdminAnnouncementDialogConfig;
    if (announcementID) {
      this._dialogModeService.isEditDialog = true;
      config = {
        announcement: this.announcements.get(announcementID),
        id: announcementID,
      };
    }

    this._matDialog
      .open(AdminAnnouncementDialogComponent, {data: config} as MatDialogConfig)
      .afterClosed()
      .pipe(take(1))

      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  private _initAnnouncements(announcementsObject: object): void {
    if (announcementsObject) {
      Object.keys(announcementsObject).forEach(id => {
        this.announcements.set(id, announcementsObject[id]);
      });
      this.dataSource.data = Object.keys(announcementsObject);
    } else {
      this.dataSource.data = [];
    }
  }
}
