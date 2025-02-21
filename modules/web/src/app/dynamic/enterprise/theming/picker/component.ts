//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ColorSchemeService} from '@app/dynamic/enterprise/theming/services/color-scheme';
import {ThemeManagerService} from '@app/dynamic/enterprise/theming/services/manager';
import {ThemeService} from '@app/dynamic/enterprise/theming/services/theme';
import {UserService} from '@core/services/user';
import {UserSettings} from '@shared/entity/settings';
import {Theme} from '@shared/model/Config';
import {objectDiff} from '@shared/utils/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, take, switchMap, takeUntil} from 'rxjs/operators';

@Component({
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    standalone: false
})
export class StylePickerComponent implements OnInit {
  readonly isEqual = _.isEqual;
  apiSettings: UserSettings;
  settings: UserSettings;
  themes: Theme[];
  selectedThemeOption: string;
  private readonly _settingsChange = new Subject<void>();
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounceTime = 1000;

  constructor(
    private readonly _themeManageService: ThemeManagerService,
    private readonly _themeService: ThemeService,
    private readonly _userService: UserService,
    private readonly _colorSchemeService: ColorSchemeService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

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

  ngOnInit(): void {
    this.themes = this._themeService.themes;

    this._userService.currentUserSettings.pipe(take(1)).subscribe(this._selectDefaultTheme.bind(this));

    this._userService.currentUserSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onSettingsUpdate.bind(this));

    this._settingsChange
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._userService.patchCurrentUserSettings(objectDiff(this.settings, this.apiSettings))))
      .subscribe(_ => {});

    this._colorSchemeService.onColorSchemeUpdate.pipe(takeUntil(this._unsubscribe)).subscribe(theme => {
      if (this._themeService.isThemeEnforced()) {
        return;
      }

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
