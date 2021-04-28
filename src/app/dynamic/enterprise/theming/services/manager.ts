import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {ThemeInformerService} from '@core/services/theme-informer';
import {UserService} from '@core/services/user';
import {UserSettings} from '@shared/entity/settings';
import {filter} from 'rxjs/operators';
import {ColorSchemeService} from './color-scheme';
import {ThemeService} from './theme';
import {combineLatest} from 'rxjs';

@Injectable()
export class ThemeManagerService {
  readonly systemDefaultOption = 'systemDefault';
  private readonly _defaultTheme = 'light';
  private _selectedTheme = this._defaultTheme;

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _colorSchemeService: ColorSchemeService,
    private readonly _themeService: ThemeService,
    private readonly _userService: UserService,
    private readonly _themeInformerService: ThemeInformerService
  ) {}

  get isSystemDefaultThemeDark(): boolean {
    return this._colorSchemeService.hasPreferredTheme() && this._colorSchemeService.getPreferredTheme().isDark;
  }

  // Force the initial theme load during application start.
  init(): void {
    combineLatest([
      this._userService.currentUserSettings.pipe(
        filter(settings => this.getDefaultTheme(settings) !== this._selectedTheme)
      ),
      this._colorSchemeService.onColorSchemeUpdate,
    ]).subscribe(([settings, _]) => this.setTheme(this.getDefaultTheme(settings)));
  }

  setTheme(themeName: string) {
    const element = this._getLinkElementForTheme(this._selectedTheme);
    element.setAttribute('href', this._themesPath(themeName));
    element.setAttribute('class', this._themeClassName(themeName));
    this._selectedTheme = themeName;

    this._themeInformerService.isCurrentThemeDark$.next(this._isThemeDark(themeName));
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

  private readonly _themeClassName = themeName => `km-style-${themeName}`;

  private readonly _themesPath = themeName => `assets/themes/${themeName}.css`;

  private _isThemeDark(name: string): boolean {
    if (name === this.systemDefaultOption) {
      return this.isSystemDefaultThemeDark;
    }

    const selectedThemeObject = this._themeService.themes.find(theme => theme.name === name);
    return selectedThemeObject ? selectedThemeObject.isDark : false;
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

    const positionElement = this._document.head.querySelector('link[rel="stylesheet"]:last-of-type');
    if (positionElement) {
      positionElement.after(linkEl);
      return linkEl;
    }

    this._document.head.appendChild(linkEl);
    return linkEl;
  }
}
