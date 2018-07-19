import { NgModule } from '@angular/core';
import { ProjectComponent } from './project.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { ProjectRoutingModule } from './project-routing.module';
import { ProjectItemComponent } from './project-item/project-item.component';

const components: any[] = [
  ProjectComponent,
  ProjectItemComponent,
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
  entryComponents: []
})
export class ProjectModule {
}
