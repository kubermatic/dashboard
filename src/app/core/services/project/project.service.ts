import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {EMPTY, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, first, map, shareReplay, switchMap, switchMapTo} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {Project} from '../../../shared/entity/project';
import {ProjectUtils} from '../../../shared/utils/project-utils/project-utils';
import {ParamsService, PathParam} from '../params/params.service';
import {SettingsService} from '../settings/settings.service';

@Injectable()
export class ProjectService {
  onProjectChange = new EventEmitter<Project>();
  onProjectsUpdate = new Subject<void>();

  private readonly _restRoot: string = environment.restRoot;
  private readonly _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  private _projects$: Observable<Project[]>;
  private _myProjects$: Observable<Project[]>;
  private _project$: Observable<Project>;
  private _displayAllChanged = new Subject<boolean>();
  private _displayAll: boolean;

  constructor(
    private readonly _router: Router,
    private readonly _params: ParamsService,
    private readonly _appConfig: AppConfigService,
    private readonly _settingsService: SettingsService,
    private readonly _http: HttpClient
  ) {
    this._displayAll = this._settingsService.defaultUserSettings.displayAllProjectsForAdmin;
  }

  get projects(): Observable<Project[]> {
    if (!this._projects$) {
      this._initProjectsObservable();
    }

    return this._projects$;
  }

  get myProjects(): Observable<Project[]> {
    if (!this._myProjects$) {
      this._myProjects$ = merge(this.onProjectsUpdate, this._refreshTimer$)
        .pipe(switchMap(_ => this._getProjects(false)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._myProjects$;
  }

  get selectedProject(): Observable<Project> {
    if (!this._project$) {
      this._project$ = merge(this._params.onParamChange, this.projects.pipe(first()))
        .pipe(switchMapTo(this.projects))
        .pipe(map(projects => projects.find(project => project.id === this._selectedProjectID)))
        .pipe(switchMap(project => (project ? of(project) : this._getProject(this._selectedProjectID))))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._project$;
  }

  delete(projectID: string): Observable<Project> {
    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.delete<Project>(url);
  }

  selectProject(project: Project): Promise<boolean> {
    if (ProjectUtils.isProjectActive(project)) {
      this.onProjectChange.emit(project);
      return this._router.navigate([`/projects/${project.id}/clusters`]);
    }

    return this._router.navigate(['/projects']);
  }

  private get _selectedProjectID(): string {
    return this._params.get(PathParam.ProjectID);
  }

  private _initProjectsObservable(): void {
    this._settingsService.userSettings.subscribe(settings =>
      this._displayAll !== settings.displayAllProjectsForAdmin
        ? this._displayAllChanged.next((this._displayAll = settings.displayAllProjectsForAdmin))
        : null
    );

    this._projects$ = merge(this.onProjectsUpdate, this._refreshTimer$, this._displayAllChanged)
      .pipe(switchMap(_ => this._getProjects(this._displayAll)))
      .pipe(shareReplay({refCount: true, bufferSize: 1}));
  }

  private _getProjects(displayAll: boolean): Observable<Project[]> {
    const url = `${this._restRoot}/projects?displayAll=${displayAll}`;
    return this._http.get<Project[]>(url).pipe(catchError(() => of<Project[]>()));
  }

  private _getProject(projectID: string): Observable<Project> {
    if (!projectID) {
      return EMPTY;
    }

    const url = `${this._restRoot}/projects/${projectID}`;
    return this._http.get<Project>(url).pipe(catchError(() => of<Project>()));
  }
}
