import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {fakeProject, fakeProjects} from '../fake-data/project.fake';

@Injectable()
export class ProjectMockService {
  onProjectChange = new EventEmitter<ProjectEntity>();
  onProjectsUpdate = new Subject<void>();

  get selectedProject(): Observable<ProjectEntity> {
    return of(fakeProject());
  }

  get projects(): Observable<ProjectEntity[]> {
    return of(fakeProjects());
  }

  delete(projectID: string): Observable<any> {
    return of(null);
  }
}
