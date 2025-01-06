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

import {ChangeDetectorRef, Component, Inject, OnChanges, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import { SettingsService } from '@app/core/services/settings';
import { UserService } from '@app/core/services/user';
import {AdminAnnouncement, AdminSettings, mockAnnouncements} from '@app/shared/entity/settings';
import { take } from 'rxjs';

enum Column {
  Message = 'message',
  Read = 'read',
}

@Component({
  // check the name
  selector: 'km-announcement',
  templateUrl: './template.html',
})
export class AnnouncementDialogComponent implements OnInit, OnChanges {
  readonly Column = Column;
  dataSource = new MatTableDataSource<string>();
  displayedColumns: string[] = Object.values(Column);
  announcements = new Map<string, AdminAnnouncement>();
  readAnnouncements: string[] = [];

  constructor(
    private readonly _settingsService: SettingsService,
    public _matDialogRef: MatDialogRef<AnnouncementDialogComponent>,
    private readonly _userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: AdminAnnouncement[],
    private readonly _cdr: ChangeDetectorRef,

  ) {}

  ngOnInit(): void {

    console.log(this.announcements);
  }

  ngOnChanges(): void {
    this._getAnnouncements();
    this._getReadAnnouncements();
    console.log(this.announcements);

  }

  hasAnnouncements(): boolean {
    return !!Object.keys(this.announcements).length
  }

  markAsRead(announcement: string): void {
    this.readAnnouncements.push(announcement)
  }

  isMessageRead(announcement: string): boolean {
    return this.readAnnouncements.includes(announcement)
  }

  private _getAnnouncements(): void {
    this._settingsService.adminSettings.pipe(take(1)).subscribe((settings: AdminSettings) => {

      if (settings.announcements) {
        Object.keys(mockAnnouncements).forEach(id => {
          this.announcements.set(id, mockAnnouncements[id])
        })
        this.dataSource.data = Object.keys(this.announcements)
      }
    })
    this._cdr.detectChanges();
  }

  private _getReadAnnouncements(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(settings => this.readAnnouncements = settings.readAnnouncements)
  }
}
