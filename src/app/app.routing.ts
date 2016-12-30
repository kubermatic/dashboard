import { Routes } from "@angular/router";
import { FrontpageComponent } from "./frontpage/frontpage.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { AuthGuard } from "./auth/auth.guard";
import {WizardComponent} from "./dashboard/wizard/wizard.component";

export const appRoutes: Routes = [
  {
    path: "welcome",
    component: FrontpageComponent
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "wizard",
        component: WizardComponent
      },
    ]
  },
  {
    path: "**",
    redirectTo: "welcome"
  }
];
