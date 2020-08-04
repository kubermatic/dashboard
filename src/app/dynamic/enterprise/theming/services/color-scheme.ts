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

import {EventEmitter, Injectable} from '@angular/core';
import {timer} from 'rxjs';
import {ThemeService} from './theme';
import {Theme} from '../../../../shared/model/Config';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
  NoPreference = 'no-preference',
}

@Injectable()
export class ColorSchemeService {
  private readonly _colorSchemeMediaQuery = colorScheme => `(prefers-color-scheme: ${colorScheme})`;
  private readonly _timerInterval = 1000;
  private _selectedColorScheme = ColorScheme.NoPreference;

  readonly onColorSchemeUpdate = new EventEmitter<ColorScheme>();

  constructor(private readonly _themeService: ThemeService) {
    timer(0, this._timerInterval).subscribe(_ => this._updateColorScheme(this._getCurrentColorScheme()));
  }

  getPreferredTheme(): Theme {
    return this._getThemeForScheme(this._selectedColorScheme);
  }

  hasPreferredTheme(): boolean {
    return this._selectedColorScheme !== ColorScheme.NoPreference;
  }

  private _getCurrentColorScheme(): ColorScheme {
    if (this._matchesColorScheme(ColorScheme.Light)) {
      return ColorScheme.Light;
    }

    if (this._matchesColorScheme(ColorScheme.Dark)) {
      return ColorScheme.Dark;
    }

    return ColorScheme.NoPreference;
  }

  private _updateColorScheme(scheme: ColorScheme): void {
    if (scheme !== this._selectedColorScheme) {
      this._selectedColorScheme = scheme;
      this.onColorSchemeUpdate.next(this._selectedColorScheme);
    }
  }

  private _getThemeForScheme(scheme: ColorScheme): Theme {
    return this._themeService.themes.find(theme => scheme === theme.name);
  }

  private _matchesColorScheme(scheme: ColorScheme): boolean {
    return window.matchMedia(this._colorSchemeMediaQuery(scheme)).matches;
  }
}
