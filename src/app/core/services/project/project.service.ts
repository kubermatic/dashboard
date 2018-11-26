import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';

@Injectable()
export class ProjectService {
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project: ProjectEntity;

  changeSelectedProject(data: ProjectEntity): void {
    this._project.next(data);
    this.project = data;
  }

  storeProject(project: ProjectEntity): void {
    localStorage.setItem(`project`, JSON.stringify(project));
  }

  removeProject(): void {
    localStorage.removeItem('project');
  }

  getProjectFromStorage(): ProjectEntity {
    const project = localStorage.getItem('project');
    return project && JSON.parse(project);
  }
}
