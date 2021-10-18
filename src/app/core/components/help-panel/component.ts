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

import {Component, ElementRef, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ChangelogManagerService} from '@core/services/changelog-manager';
import {ChangelogService} from '@core/services/changelog';
import {SettingsService} from '@core/services/settings';
import {slideOut} from '@shared/animations/slide';
import {AdminSettings, CustomLinkLocation} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-help-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [slideOut],
})
export class HelpPanelComponent implements OnInit {
  settings: AdminSettings;

  private _isOpen = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _changelogManagerService: ChangelogManagerService,
    private readonly _changelogService: ChangelogService,
    private readonly _settingsService: SettingsService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(s => (this.settings = s));
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
    this._changelogManagerService.open();
    this._isOpen = false;
  }

  hasChangelog(): boolean {
    return !!this._changelogService.changelog;
  }

  goToAPIDocs(): void {
    this._router.navigate(['rest-api']);
    this._isOpen = false;
  }

  shouldShowPanel(): boolean {
    return (
      this.hasChangelog() ||
      this.settings.displayAPIDocs ||
      this.settings.customLinks.some(link => link.location === CustomLinkLocation.HelpPanel)
    );
  }
}
