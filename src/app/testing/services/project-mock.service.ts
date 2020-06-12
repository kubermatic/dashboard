import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {Project} from '../../shared/entity/project';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';

@Injectable()
export class ProjectMockService {
  onProjectChange = new EventEmitter<Project>();
  onProjectsUpdate = new Subject<void>();

  get selectedProject(): Observable<Project> {
    return of(fakeProject());
  }

  get projects(): Observable<Project[]> {
    return of(fakeProjects());
  }

  delete(projectID: string): Observable<any> {
    return of(null);
  }
}
