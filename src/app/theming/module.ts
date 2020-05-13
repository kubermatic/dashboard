import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {StylePickerComponent} from './picker/component';
import {ColorSchemeService} from './services/color-scheme';
import {StyleManager} from './services/manager';

const routes: Routes = [
  {path: '', outlet: 'theming', component: StylePickerComponent},
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [StyleManager, ColorSchemeService],
  declarations: [StylePickerComponent],
})
export class ThemingModule {}
