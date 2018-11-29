import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {fakeProject} from '../fake-data/project.fake';

@Injectable()
export class ProjectMockService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  project = fakeProject();

  changeSelectedProject(data: ProjectEntity): void {
    this._project.next(fakeProject());
    this.project = fakeProject();
  }

  storeProject(projectID: string): void {
    localStorage.setItem(`project`, fakeProject().id);
  }

  removeProject(): void {
    localStorage.removeItem('project');
  }

  getProjectFromStorage(): string {
    return localStorage.getItem('project');
  }
}
