import { AuthGuard } from './../core/services/auth/auth.guard';
import { SshkeyComponent } from './sshkey.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
    {
        path: '',
        component: SshkeyComponent,
        canActivate: [AuthGuard],
        data: { title: "Manage SSH Keys" }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SshkeyRoutingModule { }
