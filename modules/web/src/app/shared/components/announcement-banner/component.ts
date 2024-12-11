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
import { MatDialog } from '@angular/material/dialog';
import {NavigationEnd, Router} from '@angular/router';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {CookieService} from 'ngx-cookie-service';
import {filter, Subject, take, takeUntil} from 'rxjs';
import { AnnouncementDialogComponent } from '../announcement/component';
import { DialogModeService } from '@app/core/services/dialog-mode';

const PAGES_WITHOUT_ANNOUNCEMENT_BANNER = ['/settings', '/account', '/rest-api', '/terms-of-service$', '/404$'];
@Component({
  selector: 'km-announcement-banner',
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
//
//
//
//
// check the authourization
//
//
//
//
export class AnnouncementbannerComponent implements OnInit {
  curentPath: string;
  announcements: AdminAnnouncement[];
  private _showAnnouncementBanner: boolean = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private _router: Router,
    private readonly _cookieService: CookieService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService,
  ) {}

  get checkPages(): boolean {
    return this._showAnnouncementBanner && !!this.announcements.length;
  }

  ngOnInit(): void {
    this._router.events
      .pipe(filter((event: NavigationEnd) => event instanceof NavigationEnd))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(event => {
        if (PAGES_WITHOUT_ANNOUNCEMENT_BANNER.includes(`/${event.urlAfterRedirects.split('/')[1]}`)) {
          this._showAnnouncementBanner = false;
        } else {
          this._showAnnouncementBanner = true;
        }
      });

    this._getAnnouncements();
  }

  private _getAnnouncements(): void {
    const cookieValue = this._cookieService.get('announcements');
    if (cookieValue?.length) {
      const announcements: AdminAnnouncement[] = JSON.parse(cookieValue).filter(
        (ann: AdminAnnouncement) => ann.status && (!ann.expires || new Date(ann.expires) > new Date())
      );
      this.announcements = announcements.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  openAnnouncementsDialog(): void {
    this._dialogModeService.isEditDialog = true;

    console.log("annoncement dialog")
    this._matDialog
    .open(AnnouncementDialogComponent, {data: this.announcements})
    .afterClosed()
    .pipe(take(1))
    .subscribe(_ => {
      this._dialogModeService.isEditDialog = false;
    })
  }

  closeBanner(): void {
    console.log("closeBanner");
    console.log("before",this.announcements);
    this.announcements.shift()
    console.log("after",this.announcements);

  }
}
