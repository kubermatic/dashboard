import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectComponent } from '../project/project.component';
import { AuthGuard } from './../core/services/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ProjectComponent,
    canActivate: [AuthGuard],
    data: { title: 'Manage Projects' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {
}
