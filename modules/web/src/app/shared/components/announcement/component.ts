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

import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {CookieService} from 'ngx-cookie-service';

enum Column {
  Message = 'message',
  // Actions = 'actions',
}

@Component({
  selector: 'km-announcement',
  templateUrl: './template.html',
})
export class AnnouncementDialogComponent implements OnInit {
  readonly Column = Column;
  dataSource = new MatTableDataSource<AdminAnnouncement>();
  displayedColumns: string[] = Object.values(Column);
  announcements: AdminAnnouncement[] = [];

  constructor(
    private readonly _cookieService: CookieService,
    public _matDialogRef: MatDialogRef<AnnouncementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminAnnouncement[],
  ) {}

  ngOnInit(): void {
    this._getAnnouncements();
  }

  private _getAnnouncements(): void {
    const cookieValue = this._cookieService.get('announcements');
    if (cookieValue?.length) {
      this.announcements = JSON.parse(cookieValue)
        .filter((ann: AdminAnnouncement) => ann.status && (!ann.expires || new Date(ann.expires) > new Date()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.dataSource.data = this.announcements;
    }
  }
}
