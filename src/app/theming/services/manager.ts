import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {AppConfigService} from '../../app-config.service';
import {UserSettings} from '../../shared/entity/MemberEntity';
import {ColorSchemeService} from './color-scheme';

@Injectable()
export class StyleManager {
  private readonly _styleClassName = styleName => `km-style-${styleName}`;
  private readonly _themesPath = styleName => `assets/themes/${styleName}.css`;
  private readonly _defaultTheme = 'light';
  private _selectedStyle = this._defaultTheme;

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _appConfig: AppConfigService,
    private readonly _colorSchemeService: ColorSchemeService
  ) {}

  setStyle(styleName: string) {
    if (this._selectedStyle) {
      this._removeStyle(this._selectedStyle);
    }

    this._getLinkElementForStyle(styleName).setAttribute(
      'href',
      this._themesPath(styleName)
    );
    this._selectedStyle = styleName;
  }

  /**
   Pre-selects theme based on user preference. Priority is as follows:
   - use enforced_theme from the config.json
   - use theme stored in user settings config
   - use theme based on 'prefers-color-scheme' value
   - use light theme as a fallback
   **/
  getDefaultTheme(settings: UserSettings): string {
    if (this.isThemeEnforced()) {
      return this._appConfig.getConfig().enforced_theme;
    }

    if (settings && !!settings.selectedTheme) {
      return settings.selectedTheme;
    }

    if (this._colorSchemeService.hasPreferredTheme()) {
      return this._colorSchemeService.getPreferredTheme().name;
    }

    return this._defaultTheme;
  }

  isThemeEnforced(): boolean {
    return !!this._appConfig.getConfig().enforced_theme;
  }

  private _removeStyle(styleName: string) {
    const existingLinkElement = this._getExistingLinkElementForStyle(styleName);
    if (existingLinkElement) {
      this._document.head.removeChild(existingLinkElement);
    }
  }

  private _getLinkElementForStyle(styleName: string): Element {
    const linkEl = this._getExistingLinkElementForStyle(styleName);
    return linkEl ? linkEl : this._createLinkElementForStyle(styleName);
  }

  private _getExistingLinkElementForStyle(styleName: string): Element {
    return this._document.head.querySelector(
      `link[rel="stylesheet"].${this._styleClassName(styleName)}`
    );
  }

  private _createLinkElementForStyle(styleName: string): Element {
    const linkEl: HTMLLinkElement = this._document.createElement('link');
    linkEl.setAttribute('rel', 'stylesheet');
    linkEl.classList.add(this._styleClassName(styleName));
    this._document.head.appendChild(linkEl);
    return linkEl;
  }
}
