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

import {Injectable} from '@angular/core';
import {Theme} from '@shared/model/Config';
import {AppConfigService} from '@app/config.service';

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
