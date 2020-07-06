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
