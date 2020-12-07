// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ParamsService, PathParam} from '@core/services/params/service';
import {UserService} from '@core/services/user/service';
import {environment} from '@environments/environment';
import {Project} from '@shared/entity/project';
import {ProjectUtils} from '@shared/utils/project-utils/project-utils';
import {EMPTY, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap, switchMapTo, take} from 'rxjs/operators';

@Injectable()
export class ProjectService {
  onProjectChange = new EventEmitter<Project>();
  onProjectsUpdate = new Subject<void>();

  private readonly _restRoot: string = environment.restRoot;
  private readonly _refreshTime = 10; // in seconds
  private readonly _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);

  private _projects$: Observable<Project[]>;
  private _myProjects$: Observable<Project[]>;
  private _project$: Observable<Project>;
  private _displayAllChanged = new Subject<boolean>();
  private _displayAll: boolean;

  constructor(
    private readonly _router: Router,
    private readonly _params: ParamsService,
    private readonly _appConfig: AppConfigService,
    private readonly _userService: UserService,
    private readonly _http: HttpClient
  ) {
    this._displayAll = this._userService.defaultUserSettings.displayAllProjectsForAdmin;
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
      this._project$ = merge(this._params.onParamChange, this.projects.pipe(take(1)))
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
    this._userService.currentUserSettings.subscribe(settings =>
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
