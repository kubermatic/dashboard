import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClusterBackupsComponent } from './list/component';
import { AuthGuard, AuthzGuard } from '@app/core/services/auth/guard';

const routes: Routes = [
  {
    path: '',
    component: ClusterBackupsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClusterBackupsRoutingModule { }
