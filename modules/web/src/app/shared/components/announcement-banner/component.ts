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

import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {NavigationEnd, Router} from '@angular/router';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {filter, Subject, takeUntil} from 'rxjs';
import {AnnouncementsDialogComponent} from '@shared/components/announcements-dialog/component';
import {UserService} from '@app/core/services/user';

const PAGES_WITHOUT_ANNOUNCEMENT_BANNER = ['/settings', '/account', '/rest-api', '/terms-of-service$', '/404$'];
@Component({
  selector: 'km-announcement-banner',
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class AnnouncementBannerComponent implements OnInit, OnChanges {
  @Input() announcements: Map<string, AdminAnnouncement>;
  curentPath: string;
  readAnnouncements: string[] = [];
  showAnnouncementBanner: boolean = false;
  currentAnnouncementID: string = '';
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private _router: Router,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._router.events
      .pipe(filter((event: NavigationEnd) => event instanceof NavigationEnd))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(event => {
        if (PAGES_WITHOUT_ANNOUNCEMENT_BANNER.includes(`/${event.urlAfterRedirects.split('/')[1]}`)) {
          this.showAnnouncementBanner = false;
        } else {
          this.showAnnouncementBanner = true;
        }
      });
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => {
      if (user?.readAnnouncements) {
        this.readAnnouncements = user.readAnnouncements;
      }
      this._updateCurrentAnnouncementID();
    });
  }

  ngOnChanges(): void {
    this._updateCurrentAnnouncementID();
  }

  openAnnouncementsDialog(): void {
    const announcementsObject = Object.fromEntries(this.announcements);
    this._matDialog.open(AnnouncementsDialogComponent, {data: announcementsObject});
  }

  closeBanner(): void {
    this.readAnnouncements.push(this.currentAnnouncementID);
    this._userService.patchReadAnnouncements(this.readAnnouncements).subscribe(announcements => {
      this.readAnnouncements = announcements;
    });
  }

  private _updateCurrentAnnouncementID(): void {
    this.currentAnnouncementID = Array.from(this.announcements.keys()).find(id => !this.readAnnouncements.includes(id));
  }
}
