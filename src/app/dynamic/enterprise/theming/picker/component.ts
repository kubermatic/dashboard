import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, first, switchMap, takeUntil} from 'rxjs/operators';
import {ColorSchemeService} from '../services/color-scheme';
import {ThemeManagerService} from '../services/manager';
import {ThemeService} from '../services/theme';
import {Theme} from '../../../../shared/model/Config';
import {SettingsService} from '../../../../core/services/settings/settings.service';
import {NotificationService} from '../../../../core/services';
import {objectDiff} from '../../../../shared/utils/common-utils';
import {UserSettings} from '../../../../shared/entity/MemberEntity';

@Component({
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylePickerComponent implements OnInit {
  private readonly _settingsChange = new Subject<void>();
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounceTime = 1000;

  readonly systemDefaultOption = 'systemDefault';
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
    return (
      this._colorSchemeService.hasPreferredTheme() &&
      this._colorSchemeService.getPreferredTheme().isDark
    );
  }

  private get _systemDefaultThemeName(): string {
    return this._colorSchemeService.hasPreferredTheme()
      ? this._colorSchemeService.getPreferredTheme().name
      : this._themeManageService.getDefaultTheme(this.settings);
  }

  constructor(
    private readonly _themeManageService: ThemeManagerService,
    private readonly _themeService: ThemeService,
    private readonly _settingsService: SettingsService,
    private readonly _colorSchemeService: ColorSchemeService,
    private readonly _notificationService: NotificationService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.themes = this._themeService.themes;

    this._settingsService.userSettings
      .pipe(first())
      .subscribe(this._selectDefaultTheme.bind(this));

    this._settingsService.userSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onSettingsUpdate.bind(this));

    this._settingsChange
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this._settingsService.patchUserSettings(
            objectDiff(this.settings, this.apiSettings)
          )
        )
      )
      .subscribe(_ => this._settingsService.refreshUserSettings());

    this._colorSchemeService.onColorSchemeUpdate
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(theme => {
        if (
          this.settings &&
          !this.settings.selectedTheme &&
          this.hasPreferredTheme
        ) {
          this.selectedThemeOption = this.systemDefaultOption;
        }

        if (this.selectedThemeOption === this.systemDefaultOption) {
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
    return option === this.systemDefaultOption
      ? this._systemDefaultThemeName
      : option;
  }

  private _getUserThemeForOption(option: string): string {
    return option === this.systemDefaultOption ? null : option;
  }

  private _selectTheme(themeName: string): void {
    const expectedOption =
      themeName === undefined ? this.systemDefaultOption : themeName;
    if (this.selectedThemeOption !== expectedOption) {
      this.selectedThemeOption = expectedOption;
      this._themeManageService.setTheme(
        this._getThemeForOption(this.selectedThemeOption)
      );
    }
  }

  private _onSettingsUpdate(settings: UserSettings): void {
    if (!_.isEqual(settings, this.apiSettings)) {
      if (this.apiSettings) {
        this._notificationService.success(
          'Successfully applied external settings update'
        );
      }

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
      this.selectedThemeOption = this.systemDefaultOption;
    }

    this._themeManageService.setTheme(defaultTheme);
    this._cdr.detectChanges();
  }
}
