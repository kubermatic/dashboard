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
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {slideOut} from '@shared/animations/slide';
import {AdminSettings, CustomLinkLocation, UserSettings} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-help-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [slideOut],
})
export class HelpPanelComponent implements OnInit, OnDestroy {
  settings: AdminSettings;
  lastSeenChangelogVersion: string;
  KKPDocumentationURL = 'https://docs.kubermatic.com/kubermatic/{version}/release-notes/#/{version-anchor-link}';

  private _isOpen = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private readonly _config: AppConfigService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(s => (this.settings = s));

    this._userService.currentUserSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((settings: UserSettings) => (this.lastSeenChangelogVersion = settings.lastSeenChangelogVersion || ''));
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
      semver.replace(/\./g, '')
    );
    window.open(url, '_blank');
  }

  hasNewChangelog(): boolean {
    return this.lastSeenChangelogVersion !== this._config.getGitVersion().humanReadable;
  }

  goToAPIDocs(): void {
    this._router.navigate(['rest-api']);
    this._isOpen = false;
  }

  shouldShowPanel(): boolean {
    return (
      !this.settings.disableChangelogPopup ||
      this.settings.displayAPIDocs ||
      this.settings.customLinks.some(link => link.location === CustomLinkLocation.HelpPanel)
    );
  }
}
