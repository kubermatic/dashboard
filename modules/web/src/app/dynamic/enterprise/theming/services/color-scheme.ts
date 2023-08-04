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

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _themeService: ThemeService
  ) {
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
