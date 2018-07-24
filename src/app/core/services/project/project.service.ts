import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';

@Injectable()
export class ProjectService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();

  changeSelectedProject(data: ProjectEntity) {
    this._project.next(data);
  }
}
