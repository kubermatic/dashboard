import { AuthGuard } from './../core/services/auth/auth.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WizardComponent } from 'app/wizard/wizard.component';

const routes: Routes = [
    {
        path: '',
        component: WizardComponent,
        canActivate: [AuthGuard],
        data: { title: "Create Cluster with Nodes" }
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class WizardRoutingModule { }
