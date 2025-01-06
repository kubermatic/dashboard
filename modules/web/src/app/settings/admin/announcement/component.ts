// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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
import {AdminAnnouncementDialogComponent} from './announcement-dialog/component';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {switchMap, take, takeUntil} from 'rxjs/operators';
import {AdminAnnouncement, AdminSettings} from '@app/shared/entity/settings';
import {StatusIcon} from '@app/shared/utils/health-status';
import { Subject } from 'rxjs';
import { SettingsService } from '@app/core/services/settings';

enum Column {
  Status = 'status',
  Message = 'message',
  Expires = 'expires',
  CreatedAt = 'createdAt',
  Actions = 'actions',
}

interface adminAnnouncementStatus {
  message: string;
  icon: StatusIcon;
}

@Component({
  selector: 'km-admin-announcement',
  templateUrl: 'template.html',
})
export class AdminAnnouncementComponent implements OnInit, OnDestroy {
  readonly Column = Column;
  private _unsubscribe = new Subject<void>();
  adminSettings: AdminSettings;
  dataSource = new MatTableDataSource<Map<string,AdminAnnouncement>>();
  displayedColumns: string[] = Object.values(Column);
  announcements = new Map<string, AdminAnnouncement>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.adminSettings = settings
      if (settings.announcements) {
        Object.keys(settings.announcements).forEach(id => {
          this.announcements.set(id, settings.announcements[id])
        })
      }
    })
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  removeAnnouncement(removedMessage: string): void {
    console.log(removedMessage);

  }

  addAnnouncementDialog(announcement?: AdminAnnouncement): void {

    if (announcement) {
      this._dialogModeService.isEditDialog = true;
    }

    this._matDialog
      .open(AdminAnnouncementDialogComponent, {data: announcement} as MatDialogConfig)
      .afterClosed()
      .pipe(take(1))
      .pipe(switchMap(announcement => {
        this._dialogModeService.isEditDialog = false;
        this.announcements.set("dsfsfsdfs",announcement )

       return this._settingsService.patchAdminSettings({...this.adminSettings, announcements: Object.fromEntries(this.announcements)})
      }))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  getStatus(announcement: AdminAnnouncement): adminAnnouncementStatus {
    if (new Date(announcement.expires) < new Date()) {
      return {message: 'Expired', icon: StatusIcon.Unknown};
    }
    if (!announcement.isActive) {
      return {message: 'Paused', icon: StatusIcon.Stopped};
    }
    return {message: 'Active', icon: StatusIcon.Running};
  }

}
