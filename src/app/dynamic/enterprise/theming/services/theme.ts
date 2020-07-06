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

import {Injectable} from '@angular/core';
import {Theme} from '../../../../shared/model/Config';
import {AppConfigService} from '../../../../app-config.service';

@Injectable()
export class ThemeService {
  private readonly _configThemes: Theme[];
  private readonly _defaultThemes = [
    {
      name: 'light',
      displayName: 'Light',
      isDark: false,
    },
    {
      name: 'dark',
      displayName: 'Dark',
      isDark: true,
    },
  ];

  get themes(): Theme[] {
    const defaultThemeNames = new Set(this._defaultThemes.map(theme => theme.name));
    const filteredThemes = this._configThemes.filter(theme => !defaultThemeNames.has(theme.name));
    return [...this._defaultThemes, ...filteredThemes];
  }

  get enforcedTheme(): string {
    return this._appConfig.getConfig().enforced_theme;
  }

  constructor(private readonly _appConfig: AppConfigService) {
    this._configThemes = this._hasAdditionalThemes() ? this._appConfig.getConfig().themes : [];
  }

  isThemeEnforced(): boolean {
    return !!this._appConfig.getConfig().enforced_theme;
  }

  private _hasAdditionalThemes(): boolean {
    return this._appConfig.getConfig().themes && this._appConfig.getConfig().themes.length > 0;
  }
}
