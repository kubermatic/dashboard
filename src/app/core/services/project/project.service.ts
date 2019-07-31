import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, filter, first, map, shareReplay, switchMapTo} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {ProjectUtils} from '../../../shared/utils/project-utils/project-utils';
import {ParamsService, PathParam} from '../params/params.service';

@Injectable()
export class ProjectService {
  onProjectChange = new EventEmitter<ProjectEntity>();
  onProjectsUpdate = new Subject<void>();

  private readonly _restRoot: string = environment.restRoot;
  private _projects$: Observable<ProjectEntity[]>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(
      private _router: Router, private readonly _params: ParamsService, private readonly _appConfig: AppConfigService,
      private readonly _http: HttpClient) {}

  get projects(): Observable<ProjectEntity[]> {
    if (!this._projects$) {
      this._projects$ = merge(this.onProjectsUpdate, this._refreshTimer$)
                            .pipe(switchMapTo(this._getProjects()))
                            .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._projects$;
  }

  project(projectID: string): Observable<ProjectEntity> {
    return this.projects.pipe(first()).pipe(map(projects => projects.find(project => project.id === projectID)));
  }


  get selectedProject(): Observable<ProjectEntity> {
    return merge(this._params.onParamChange, this.projects.pipe(first()))
        .pipe(switchMapTo(this.projects))
        .pipe(map(projects => projects.find(project => project.id === this._selectedProjectID)))
        .pipe(filter(project => project !== undefined));
  }

  delete(projectID: string): Observable<ProjectEntity> {
    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.delete<ProjectEntity>(url);
  }

  selectProject(project: ProjectEntity): Promise<boolean> {
    if (ProjectUtils.isProjectActive(project)) {
      this.onProjectChange.emit(project);
      return this._router.navigate([`/projects/${project.id}/clusters`]);
    }

    return this._router.navigate(['/projects']);
  }

  private get _selectedProjectID(): string {
    return this._params.get(PathParam.ProjectID);
  }

  private _getProjects(): Observable<ProjectEntity[]> {
    const url = `${this._restRoot}/projects`;
    return this._http.get<ProjectEntity[]>(url).pipe(catchError(() => of<ProjectEntity[]>()));
  }
}
