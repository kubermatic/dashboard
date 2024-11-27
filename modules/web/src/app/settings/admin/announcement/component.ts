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

import {Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {CookieService} from 'ngx-cookie-service';
import {AdminAnnouncementDialogComponent} from './announcement-dialog/component';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {take} from 'rxjs/operators';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {StatusIcon} from '@app/shared/utils/health-status';

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
export class AdminAnnouncementComponent implements OnInit {
  readonly Column = Column;
  dataSource = new MatTableDataSource<AdminAnnouncement>();
  displayedColumns: string[] = Object.values(Column);
  announcements: AdminAnnouncement[] = [];

  constructor(
    private readonly _cookieService: CookieService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {
    if (!this._cookieService.check('announcements')) {
      this._saveMockDataToCookie();
    }
  }

  ngOnInit(): void {
    this._getAnnouncements();
  }

  removeAnnouncement(removedMessage: string): void {
    this.announcements = this.announcements.filter(announcement => announcement.id !== removedMessage);
    this._saveMockDataToCookie();
    this._getAnnouncements();
  }

  addAnnouncementDialog(announcement?: AdminAnnouncement): void {
    if (announcement) {
      this._dialogModeService.isEditDialog = true;
    }

    this._matDialog
      .open(AdminAnnouncementDialogComponent, {data: announcement} as MatDialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(newAnnouncement => {
        this._dialogModeService.isEditDialog = false;
        if (newAnnouncement) {
          this.removeAnnouncement(newAnnouncement.id);
          this.announcements.push(newAnnouncement);
          this._saveMockDataToCookie();
          this._getAnnouncements();
        }
      });
  }

  getStatus(announcement: AdminAnnouncement): adminAnnouncementStatus {
    if (new Date(announcement.expires) < new Date()) {
      return {message: 'Expired', icon: StatusIcon.Unknown};
    }
    if (!announcement.status) {
      return {message: 'Paused', icon: StatusIcon.Stopped};
    }
    return {message: 'Active', icon: StatusIcon.Running};
  }

  private _saveMockDataToCookie(): void {
    const serializedAnnouncements = JSON.stringify(this.announcements);
    const numOfDays = 7;
    this._cookieService.set('announcements', serializedAnnouncements, numOfDays, '/');
  }

  private _getAnnouncements(): void {
    const cookieValue = this._cookieService.get('announcements');
    if (cookieValue) {
      this.announcements = JSON.parse(cookieValue);
      this.dataSource.data = this.announcements;
    }
  }
}
