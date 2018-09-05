import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { fakeProject } from '../fake-data/project.fake';

@Injectable()
export class ProjectMockService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  public project = fakeProject();

  changeSelectedProject(data: ProjectEntity) {
    this._project.next(fakeProject());
    this.project = fakeProject();
  }

  public storeProject(projectID: string): void {
    localStorage.setItem(`project`, fakeProject().id);
  }

  public removeProject() {
    localStorage.removeItem('project');
  }

  public getProjectFromStorage(): string {
    return localStorage.getItem('project');
  }
}
