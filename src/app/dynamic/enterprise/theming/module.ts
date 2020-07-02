import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {StylePickerComponent} from './picker/component';
import {ColorSchemeService} from './services/color-scheme';
import {ThemeManagerService} from './services/manager';
import {ThemeService} from './services/theme';
import {SharedModule} from '../../../shared/shared.module';

const routes: Routes = [{path: '', outlet: 'theming', component: StylePickerComponent}];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [ThemeService, ThemeManagerService, ColorSchemeService],
  declarations: [StylePickerComponent],
})
export class ThemingModule {
  constructor(private readonly _themeManager: ThemeManagerService) {
    this._themeManager.init();
  }
}
