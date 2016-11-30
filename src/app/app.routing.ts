import { Routes } from '@angular/router';
import { FrontpageComponent } from './frontpage/frontpage.component'

export const appRoutes: Routes = [
  {
    path: 'welcome',
    component: FrontpageComponent
  },
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  }
];
