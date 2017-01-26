import { Routes } from "@angular/router";
import { FrontpageComponent } from "./frontpage/frontpage.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { AuthGuard } from "./auth/auth.guard";
import { WizardComponent } from "./wizard/wizard.component";
import {ProfileComponent} from "./profile/profile.component";

export const appRoutes: Routes = [
  {
    path: "",
    component: DashboardComponent,
    children: [
      {
        path: "wizard",
        component: WizardComponent,
        canActivate: [AuthGuard],
        data: { title: "Wizard" }
      },
      {
        path: "profile",
        component: ProfileComponent,
        canActivate: [AuthGuard],
        data: { title: "Profile" }
      },
      {
        path: "welcome",
        component: FrontpageComponent,
        data: { title: "Welcome" }
      }
    ]
  },
  {
    path: "**",
    redirectTo: ""
  }
];
