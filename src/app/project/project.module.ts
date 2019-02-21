import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {EditProjectComponent} from './edit-project/edit-project.component';
import {ProjectRoutingModule} from './project-routing.module';
import {ProjectComponent} from './project.component';

const components: any[] = [
  ProjectComponent,
  EditProjectComponent,
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
  entryComponents: [EditProjectComponent],
})
export class ProjectModule {
}
