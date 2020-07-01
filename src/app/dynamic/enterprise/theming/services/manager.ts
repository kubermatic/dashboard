import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {filter} from 'rxjs/operators';
import {SettingsService} from '../../../../core/services/settings/settings.service';
import {ThemeInformerService} from '../../../../core/services/theme-informer/theme-informer.service';
import {UserSettings} from '../../../../shared/entity/settings';
import {ColorSchemeService} from './color-scheme';
import {ThemeService} from './theme';

@Injectable()
export class ThemeManagerService {
  private readonly _themeClassName = themeName => `km-style-${themeName}`;
  private readonly _themesPath = themeName => `assets/themes/${themeName}.css`;
  private readonly _defaultTheme = 'light';
  private _selectedTheme = this._defaultTheme;
  readonly systemDefaultOption = 'systemDefault';

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _colorSchemeService: ColorSchemeService,
    private readonly _themeService: ThemeService,
    private readonly _settingsService: SettingsService,
    private readonly _themeInformerService: ThemeInformerService
  ) {}

  // Force the initial theme load during application start.
  init(): void {
    this._settingsService.userSettings
      .pipe(filter(settings => this.getDefaultTheme(settings) !== this._selectedTheme))
      .subscribe(settings => this.setTheme(this.getDefaultTheme(settings)));
  }

  get isSystemDefaultThemeDark(): boolean {
    return this._colorSchemeService.hasPreferredTheme() && this._colorSchemeService.getPreferredTheme().isDark;
  }

  setTheme(themeName: string) {
    if (this._selectedTheme) {
      this._removeTheme(this._selectedTheme);
    }

    this._getLinkElementForTheme(themeName).setAttribute('href', this._themesPath(themeName));
    this._selectedTheme = themeName;

    this._themeInformerService.isCurrentThemeDark$.next(this._isThemeDark(themeName));
  }

  private _isThemeDark(name: string): boolean {
    if (name === this.systemDefaultOption) {
      return this.isSystemDefaultThemeDark;
    }

    const selectedThemeObject = this._themeService.themes.find(theme => theme.name === name);
    return selectedThemeObject ? selectedThemeObject.isDark : false;
  }

  /**
   Chooses theme based on user preference. Priority is as follows:
   - use enforced_theme from the config.json
   - use theme stored in user settings config
   - use theme based on 'prefers-color-scheme' value
   - use light theme as a fallback
   **/
  getDefaultTheme(settings: UserSettings): string {
    if (this._themeService.isThemeEnforced()) {
      return this._themeService.enforcedTheme;
    }

    if (settings && !!settings.selectedTheme) {
      return settings.selectedTheme;
    }

    if (this._colorSchemeService.hasPreferredTheme()) {
      return this._colorSchemeService.getPreferredTheme().name;
    }

    return this._defaultTheme;
  }

  private _removeTheme(styleName: string) {
    const existingLinkElement = this._getExistingLinkElementForTheme(styleName);
    if (existingLinkElement) {
      this._document.head.removeChild(existingLinkElement);
    }
  }

  private _getLinkElementForTheme(styleName: string): Element {
    const linkEl = this._getExistingLinkElementForTheme(styleName);
    return linkEl ? linkEl : this._createLinkElementForTheme(styleName);
  }

  private _getExistingLinkElementForTheme(styleName: string): Element {
    return this._document.head.querySelector(`link[rel="stylesheet"].${this._themeClassName(styleName)}`);
  }

  private _createLinkElementForTheme(styleName: string): Element {
    const linkEl: HTMLLinkElement = this._document.createElement('link');
    linkEl.setAttribute('rel', 'stylesheet');
    linkEl.classList.add(this._themeClassName(styleName));
    this._document.head.appendChild(linkEl);
    return linkEl;
  }
}
