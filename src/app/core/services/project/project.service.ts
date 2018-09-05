import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';

@Injectable()
export class ProjectService {
  // Complete project object
  private _project = new Subject<ProjectEntity>();
  selectedProjectChanges$ = this._project.asObservable();
  public project: ProjectEntity;

  changeSelectedProject(data: ProjectEntity) {
    this._project.next(data);
    this.project = data;
  }

  public storeProject(projectID: string): void {
    localStorage.setItem(`project`, projectID);
  }

  public removeProject() {
    localStorage.removeItem('project');
  }

  public getProjectFromStorage(): string {
    return localStorage.getItem('project');
  }
}
