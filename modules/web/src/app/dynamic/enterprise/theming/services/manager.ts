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

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
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
    private readonly _themeInformerService: ThemeInformerService,
    private readonly _appConfigService: AppConfigService
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

  private readonly _themesPath = themeName => {
    return `${themeName}.css?${this._appConfigService.getGitVersion().tag}`;
  };

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
