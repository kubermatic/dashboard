// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, first, switchMap, takeUntil} from 'rxjs/operators';
import {UserService} from '../../../../core/services';
import {UserSettings} from '../../../../shared/entity/settings';
import {Theme} from '../../../../shared/model/Config';
import {objectDiff} from '../../../../shared/utils/common-utils';
import {ColorSchemeService} from '../services/color-scheme';
import {ThemeManagerService} from '../services/manager';
import {ThemeService} from '../services/theme';

@Component({
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylePickerComponent implements OnInit {
  private readonly _settingsChange = new Subject<void>();
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounceTime = 1000;

  readonly isEqual = _.isEqual;

  apiSettings: UserSettings;
  settings: UserSettings;
  themes: Theme[];
  selectedThemeOption: string;

  get isThemeEnforced(): boolean {
    return this._themeService.isThemeEnforced();
  }

  get hasPreferredTheme(): boolean {
    return this._colorSchemeService.hasPreferredTheme();
  }

  get isSystemDefaultThemeDark(): boolean {
    return this._themeManageService.isSystemDefaultThemeDark;
  }

  get systemDefaultOption(): string {
    return this._themeManageService.systemDefaultOption;
  }

  private get _systemDefaultThemeName(): string {
    return this._colorSchemeService.hasPreferredTheme()
      ? this._colorSchemeService.getPreferredTheme().name
      : this._themeManageService.getDefaultTheme(this.settings);
  }

  constructor(
    private readonly _themeManageService: ThemeManagerService,
    private readonly _themeService: ThemeService,
    private readonly _userService: UserService,
    private readonly _colorSchemeService: ColorSchemeService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.themes = this._themeService.themes;

    this._userService.currentUserSettings.pipe(first()).subscribe(this._selectDefaultTheme.bind(this));

    this._userService.currentUserSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onSettingsUpdate.bind(this));

    this._settingsChange
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._userService.patchCurrentUserSettings(objectDiff(this.settings, this.apiSettings))))
      .subscribe(_ => {});

    this._colorSchemeService.onColorSchemeUpdate.pipe(takeUntil(this._unsubscribe)).subscribe(theme => {
      if (this.settings && !this.settings.selectedTheme && this.hasPreferredTheme) {
        this.selectedThemeOption = this._themeManageService.systemDefaultOption;
      }

      if (this.selectedThemeOption === this._themeManageService.systemDefaultOption) {
        this._themeManageService.setTheme(theme);
      }

      this._cdr.detectChanges();
    });
  }

  onThemeChange(option: string): void {
    this.selectedThemeOption = option;
    this._themeManageService.setTheme(this._getThemeForOption(option));
    this.settings.selectedTheme = this._getUserThemeForOption(option);
    this._settingsChange.next();
    this._cdr.detectChanges();
  }

  private _getThemeForOption(option: string): string {
    return option === this._themeManageService.systemDefaultOption ? this._systemDefaultThemeName : option;
  }

  private _getUserThemeForOption(option: string): string {
    return option === this._themeManageService.systemDefaultOption ? null : option;
  }

  private _selectTheme(themeName: string): void {
    const expectedOption = themeName === undefined ? this._themeManageService.systemDefaultOption : themeName;
    if (this.selectedThemeOption !== expectedOption) {
      this.selectedThemeOption = expectedOption;
      this._themeManageService.setTheme(this._getThemeForOption(this.selectedThemeOption));
    }
  }

  private _onSettingsUpdate(settings: UserSettings): void {
    if (!_.isEqual(settings, this.apiSettings)) {
      this.apiSettings = settings;
      this.settings = _.cloneDeep(this.apiSettings);
      this._selectTheme(this.settings.selectedTheme);
    }

    this._cdr.detectChanges();
  }

  private _selectDefaultTheme(settings: UserSettings): void {
    const defaultTheme = this._themeManageService.getDefaultTheme(settings);
    this.selectedThemeOption = defaultTheme;

    if (settings && !settings.selectedTheme && this.hasPreferredTheme) {
      this.selectedThemeOption = this._themeManageService.systemDefaultOption;
    }

    this._themeManageService.setTheme(defaultTheme);
    this._cdr.detectChanges();
  }
}
