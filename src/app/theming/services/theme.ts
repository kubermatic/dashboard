import {Injectable} from '@angular/core';
import {AppConfigService} from '../../app-config.service';
import {Theme} from '../../shared/model/Config';

@Injectable()
export class ThemeService {
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
    const defaultThemeNames = new Set(
      this._defaultThemes.map(theme => theme.name)
    );
    const filteredThemes = this._appConfig
      .getConfig()
      .themes.filter(theme => !defaultThemeNames.has(theme.name));
    return [...this._defaultThemes, ...filteredThemes];
  }

  constructor(private readonly _appConfig: AppConfigService) {}

  isThemeEnforced(): boolean {
    return !!this._appConfig.getConfig().enforced_theme;
  }
}
