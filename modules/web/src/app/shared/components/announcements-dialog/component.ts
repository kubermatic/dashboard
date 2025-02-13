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

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {UserService} from '@app/core/services/user';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {take} from 'rxjs';

enum Column {
  Message = 'message',
  Created = 'created',
  Actions = 'actions',
}

@Component({
  selector: 'km-announcements-dialog',
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class AnnouncementsDialogComponent implements OnInit {
  readonly Column = Column;
  dataSource = new MatTableDataSource<string>();
  displayedColumns: string[] = Object.values(Column);
  announcements = new Map<string, AdminAnnouncement>();
  readAnnouncements: string[] = [];
  markingAnnouncementsAsRead: Record<string, boolean> = {};

  constructor(
    public _matDialogRef: MatDialogRef<AnnouncementsDialogComponent>,
    private readonly _userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: Map<string, AdminAnnouncement>
  ) {}

  ngOnInit(): void {
    this._matDialogRef.addPanelClass('km-announcements-dialog');
    this._getAnnouncements();
  }

  hasAnnouncements(): boolean {
    return !!this.announcements?.size;
  }

  markAsRead(announcement: string): void {
    this.markingAnnouncementsAsRead[announcement] = true;
    this._userService
      .patchReadAnnouncements([...this.readAnnouncements, announcement])
      .pipe(take(1))
      .subscribe(announcements => {
        this.readAnnouncements = announcements;
        this.markingAnnouncementsAsRead[announcement] = false;
      });
  }

  isMessageRead(announcementId: string): boolean {
    return this.readAnnouncements?.includes(announcementId);
  }

  getMessage(announcementID: string): string {
    return this.announcements.get(announcementID).message;
  }

  getCreatedAt(announcementID: string): string {
    return this.announcements.get(announcementID).createdAt;
  }

  private _getAnnouncements(): void {
    const announcementsSettings = this.data;

    Object.keys(announcementsSettings).forEach(id => {
      if (
        announcementsSettings[id].isActive &&
        (!announcementsSettings[id].expires || new Date(announcementsSettings[id].expires) > new Date())
      ) {
        this.announcements.set(id, announcementsSettings[id]);
      }
    });
    this.dataSource.data = Array.from(this.announcements.keys());
    this._getReadAnnouncements();
  }

  private _getReadAnnouncements(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(settings => {
      if (settings.readAnnouncements) {
        this.readAnnouncements = settings.readAnnouncements.filter(id =>
          Array.from(this.announcements.keys()).includes(id)
        );
      }
    });
  }
}
