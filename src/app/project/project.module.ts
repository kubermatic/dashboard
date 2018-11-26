import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {ProjectDeleteConfirmationComponent} from './project-delete-confirmation/project-delete-confirmation.component';
import {ProjectItemComponent} from './project-item/project-item.component';
import {ProjectRoutingModule} from './project-routing.module';
import {ProjectComponent} from './project.component';

const components: any[] = [
  ProjectComponent,
  ProjectItemComponent,
  ProjectDeleteConfirmationComponent,
];

@NgModule({
  imports: [
    SharedModule,
    ProjectRoutingModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [ProjectDeleteConfirmationComponent],
})
export class ProjectModule {
}
