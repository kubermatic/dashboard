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
import {MatDialog} from '@angular/material/dialog';
import {NavigationEnd, Router} from '@angular/router';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {filter, retry, Subject, take, takeUntil} from 'rxjs';
import {AnnouncementDialogComponent} from '../announcement/component';
import {SettingsService} from '@app/core/services/settings';
import {UserService} from '@app/core/services/user';

const PAGES_WITHOUT_ANNOUNCEMENT_BANNER = ['/settings', '/account', '/rest-api', '/terms-of-service$', '/404$'];
@Component({
  selector: 'km-announcement-banner',
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class AnnouncementbannerComponent implements OnInit {
  curentPath: string;
  readAnnouncements: string[] = [];
  announcements = new Map<string, AdminAnnouncement>();
  private _showAnnouncementBanner: boolean = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private _router: Router,
    private readonly _matDialog: MatDialog
  ) {}

  get checkPages(): boolean {
    return this._showAnnouncementBanner && !!this.announcements?.size;
  }

  get bannerMessage(): string {
    const messageKey = Array.from(this.announcements.keys()).find(id => !this.readAnnouncements.includes(id));
    return this.announcements.get(messageKey)?.message;
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
    this._getReadAnnouncements();
    this._getAnnouncements();
  }

  openAnnouncementsDialog(): void {
    this._matDialog
      .open(AnnouncementDialogComponent, {data: Object.fromEntries(this.announcements)})
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => {
        if (data) {
          const readAnnouncements = data.filter((value, index, self) => self.indexOf(value) === index);
          this._updateUserReadAnnouncements(readAnnouncements);
        }
      });
  }

  closeBanner(id: string): void {
    this.readAnnouncements.push(id);
    this.readAnnouncements = this.readAnnouncements.filter((value, index, self) => self.indexOf(value) === index);
    this._userService.patchReadAnnouncements(this.readAnnouncements).subscribe(announcements => {
      this.readAnnouncements = announcements;
    });
  }

  private _getAnnouncements(): void {
    const retryTimes = 4;
    this._settingsService.adminSettings.pipe(retry(retryTimes), take(1)).subscribe(adminSettings => {
      const announcements = adminSettings?.announcements;
      if (announcements) {
        Object.keys(announcements)
          .sort(
            (a, b) => new Date(announcements[b].createdAt).getTime() - new Date(announcements[a].createdAt).getTime()
          )
          .forEach(id => {
            if (
              announcements[id]?.isActive &&
              (!announcements[id]?.expires || new Date(announcements[id]?.expires) > new Date())
            ) {
              this.announcements.set(id, announcements[id]);
            }
          });
      }
    });
  }

  private _getReadAnnouncements(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(settings => {
      if (settings.readAnnouncements) {
        this.readAnnouncements = settings.readAnnouncements;
      }
    });
  }

  private _updateUserReadAnnouncements(announcements: string[]): void {
    this._userService.patchReadAnnouncements(announcements).pipe(take(1)).subscribe();
  }
}
