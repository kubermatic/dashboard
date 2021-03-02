import {Inject, Injectable} from '@angular/core';
import {ThemeService} from './theme';
import {Theme} from '@shared/model/Config';
import {DOCUMENT} from '@angular/common';
import {BehaviorSubject} from 'rxjs';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
  NoPreference = 'no-preference',
}

@Injectable()
export class ColorSchemeService {
  private readonly _colorSchemeQuery = '(prefers-color-scheme: dark)';
  private _selectedColorScheme = ColorScheme.NoPreference;
  readonly onColorSchemeUpdate = new BehaviorSubject<ColorScheme>(ColorScheme.NoPreference);

  constructor(@Inject(DOCUMENT) private readonly _document: Document, private readonly _themeService: ThemeService) {
    // Load initial color scheme.
    this._updateColorScheme(this._document.defaultView.matchMedia(this._colorSchemeQuery).matches);

    // Watch for changes.
    this._document.defaultView
      .matchMedia(this._colorSchemeQuery)
      .addEventListener('change', e => this._updateColorScheme(e.matches));
  }

  getPreferredTheme(): Theme {
    return this._getThemeForScheme(this._selectedColorScheme);
  }

  hasPreferredTheme(): boolean {
    return this._selectedColorScheme !== ColorScheme.NoPreference;
  }

  private _updateColorScheme(isDark: boolean): void {
    const scheme = isDark ? ColorScheme.Dark : ColorScheme.Light;

    if (scheme !== this._selectedColorScheme) {
      this._selectedColorScheme = scheme;
      this.onColorSchemeUpdate.next(this._selectedColorScheme);
    }
  }

  private _getThemeForScheme(scheme: ColorScheme): Theme {
    return this._themeService.themes.find(theme => scheme === theme.name);
  }
}
