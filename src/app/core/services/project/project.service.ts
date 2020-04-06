import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, filter, first, map, shareReplay, switchMapTo} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {ProjectUtils} from '../../../shared/utils/project-utils/project-utils';
import {ParamsService, PathParam} from '../params/params.service';

enum Cookies {
  DisplayAll = 'displayAllProjectsForAdmin',
}

@Injectable()
export class ProjectService {
  onProjectChange = new EventEmitter<ProjectEntity>();
  onProjectsUpdate = new Subject<void>();
  onProjectDisplayChange = new Subject<void>();
  private readonly _restRoot: string = environment.restRoot;
  private _projects$: Observable<ProjectEntity[]>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(
      private readonly _cookieService: CookieService, private _router: Router, private readonly _params: ParamsService,
      private readonly _appConfig: AppConfigService, private readonly _http: HttpClient) {}

  get projects(): Observable<ProjectEntity[]> {
    if (!this._projects$) {
      this._initProjectsObservable();
    }
    return this._projects$;
  }

  private _initProjectsObservable(): void {
    this._projects$ = merge(this.onProjectsUpdate, this._refreshTimer$)
                          .pipe(switchMapTo(this._getProjects(this.displayAll)))
                          .pipe(shareReplay({refCount: true, bufferSize: 1}));
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

  setDisplayAll(displayAll: boolean): void {
    // TODO make it dynamic, avoid using cookie
    this._cookieService.set(Cookies.DisplayAll, displayAll.toString(), 1, '/', null, false, 'Lax');
    this._initProjectsObservable();
    this.onProjectDisplayChange.next();
  }

  get displayAll(): boolean {
    return this._cookieService.get(Cookies.DisplayAll) === 'true';
  }

  private get _selectedProjectID(): string {
    return this._params.get(PathParam.ProjectID);
  }

  private _getProjects(displayAll: boolean): Observable<ProjectEntity[]> {
    const url = `${this._restRoot}/projects?displayAll=${displayAll}`;
    return this._http.get<ProjectEntity[]>(url).pipe(catchError(() => of<ProjectEntity[]>()));
  }
}
