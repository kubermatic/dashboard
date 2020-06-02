import {Injectable} from '@angular/core';
import {AppConfigService} from '../../app-config.service';
import {Theme} from '../../shared/model/Config';

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
