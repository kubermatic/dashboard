// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {AnnouncementsDialogComponent} from '@shared/components/announcements-dialog/component';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {slideOut} from '@shared/animations/slide';
import {AdminSettings, CustomLinkLocation, UserSettings} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-help-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [slideOut],
  standalone: false,
})
export class HelpPanelComponent implements OnInit, OnDestroy {
  adminSettings: AdminSettings;
  userSettings: UserSettings;
  KKPDocumentationURL = 'https://docs.kubermatic.com/kubermatic/{version}/release-notes/#{version-anchor-link}';

  private _isOpen = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private readonly _config: AppConfigService,
    private readonly _router: Router,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(s => (this.adminSettings = s));

    this._userService.currentUserSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((settings: UserSettings) => (this.userSettings = settings));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen()) {
      this.close();
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  close(): void {
    this._isOpen = false;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
  }

  openChangelog(): void {
    const semver = `v${this._config.getGitVersion().semver.major}.${this._config.getGitVersion().semver.minor}`;
    const url = this.KKPDocumentationURL.replace(/{version}/g, semver).replace(
      /{version-anchor-link}/g,
      this._config.getGitVersion().semver.raw.replace(/\./g, '')
    );
    window.open(url, '_blank', 'noopener,noreferrer');

    if (this.hasNewChangelog()) {
      this._userService
        .patchCurrentUserSettings({lastSeenChangelogVersion: this._config.getGitVersion().humanReadable})
        .pipe(take(1))
        .subscribe();
    }
  }

  hasNewChangelog(): boolean {
    return this.userSettings.lastSeenChangelogVersion !== this._config.getGitVersion().humanReadable;
  }

  goToAPIDocs(): void {
    this._router.navigate(['rest-api']);
    this._isOpen = false;
  }

  shouldShowPanel(): boolean {
    return (
      !this.adminSettings.disableChangelogPopup ||
      this.adminSettings.displayAPIDocs ||
      this.adminSettings.customLinks.some(link => link.location === CustomLinkLocation.HelpPanel) ||
      !!this.adminSettings.announcements
    );
  }

  openAnnouncementsDialog(): void {
    const sortedAnnouncements = this.adminSettings?.announcements
      ? Object.entries(this.adminSettings?.announcements).sort(
          ([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : [];
    const announcementsObject = Object.fromEntries(sortedAnnouncements);
    this._matDialog.open(AnnouncementsDialogComponent, {data: announcementsObject});
  }
}
