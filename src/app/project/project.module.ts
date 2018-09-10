import { NgModule } from '@angular/core';
import { ProjectComponent } from './project.component';
import { SharedModule } from '../shared/shared.module';
import { ProjectRoutingModule } from './project-routing.module';
import { ProjectItemComponent } from './project-item/project-item.component';
import { ProjectDeleteConfirmationComponent } from './project-delete-confirmation/project-delete-confirmation.component';

const components: any[] = [
  ProjectComponent,
  ProjectItemComponent,
  ProjectDeleteConfirmationComponent,
];

@NgModule({
  imports: [
    SharedModule,
    ProjectRoutingModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
  entryComponents: [ProjectDeleteConfirmationComponent]
})
export class ProjectModule {
}
