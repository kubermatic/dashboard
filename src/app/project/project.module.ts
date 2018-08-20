import { NgModule } from '@angular/core';
import { ProjectComponent } from './project.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { ProjectRoutingModule } from './project-routing.module';
import { ProjectItemComponent } from './project-item/project-item.component';
import { ProjectDeleteConfirmationComponent } from './project-delete-confirmation/project-delete-confirmation.component';
import { MemberComponent } from '../member/member.component';

const components: any[] = [
  ProjectComponent,
  ProjectItemComponent,
  ProjectDeleteConfirmationComponent,
  MemberComponent
];

@NgModule({
  imports: [
    SharedModule,
    MatTabsModule,
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
