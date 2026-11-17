// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Router} from '@angular/router';

import {AppConfigService} from '@app/config.service';
import {ParamsService} from '@core/services/params';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {Project} from '@shared/entity/project';
import {UserSettings} from '@shared/entity/settings';
import {fakeProjects} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DEFAULT_USER_SETTINGS_MOCK} from '@test/services/settings-mock';
import {BehaviorSubject, Subject} from 'rxjs';

import {ProjectService} from './project';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpController: HttpTestingController;
  let userSettings$: BehaviorSubject<UserSettings>;

  const refreshInterval = new AppConfigMockService().getRefreshTimeBase() * 10;
  const projectsURL = (displayAll: boolean): string => `${environment.restRoot}/projects?displayAll=${displayAll}`;

  beforeEach(() => {
    userSettings$ = new BehaviorSubject<UserSettings>({...DEFAULT_USER_SETTINGS_MOCK, displayAllProjectsForAdmin: false});

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProjectService,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Router, useValue: {}},
        {provide: ParamsService, useValue: {onParamChange: new Subject<void>()}},
        {
          provide: UserService,
          useValue: {defaultUserSettings: userSettings$.value, currentUserSettings: userSettings$.asObservable()},
        },
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProjectService);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should refetch projects on every refresh tick when the previous request has finished', fakeAsync(() => {
    const subscription = service.projects.subscribe();
    tick();
    httpController.expectOne(projectsURL(false)).flush(fakeProjects());

    tick(refreshInterval);
    httpController.expectOne(projectsURL(false)).flush(fakeProjects());

    subscription.unsubscribe();
  }));

  it('should not cancel a request that takes longer than the refresh interval', fakeAsync(() => {
    let projects: Project[] = [];
    const subscription = service.projects.subscribe(result => (projects = result));
    tick();
    const slowRequest = httpController.expectOne(projectsURL(false));

    tick(refreshInterval * 2);

    expect(slowRequest.cancelled).toBe(false);
    httpController.expectNone(projectsURL(false));

    slowRequest.flush(fakeProjects());
    expect(projects.length).toBe(fakeProjects().length);

    subscription.unsubscribe();
  }));

  it('should cancel the running request and refetch immediately when projects are updated', fakeAsync(() => {
    const subscription = service.projects.subscribe();
    tick();
    const runningRequest = httpController.expectOne(projectsURL(false));

    service.onProjectsUpdate.next();
    tick();

    expect(runningRequest.cancelled).toBe(true);
    httpController.expectOne(projectsURL(false)).flush(fakeProjects());

    subscription.unsubscribe();
  }));

  it('should cancel the running request and refetch with the new value when display all changes', fakeAsync(() => {
    const subscription = service.projects.subscribe();
    tick();
    const runningRequest = httpController.expectOne(projectsURL(false));

    userSettings$.next({...userSettings$.value, displayAllProjectsForAdmin: true});
    tick();

    expect(runningRequest.cancelled).toBe(true);
    httpController.expectOne(projectsURL(true)).flush(fakeProjects());

    subscription.unsubscribe();
  }));

  it('should not cancel a slow request of my projects or all projects on refresh ticks', fakeAsync(() => {
    const subscription = service.myProjects.subscribe();
    subscription.add(service.allProjects.subscribe());
    tick();
    const myProjectsRequest = httpController.expectOne(projectsURL(false));
    const allProjectsRequest = httpController.expectOne(projectsURL(true));

    tick(refreshInterval * 2);

    expect(myProjectsRequest.cancelled).toBe(false);
    expect(allProjectsRequest.cancelled).toBe(false);
    httpController.expectNone(projectsURL(false));
    httpController.expectNone(projectsURL(true));

    myProjectsRequest.flush(fakeProjects());
    allProjectsRequest.flush(fakeProjects());
    subscription.unsubscribe();
  }));
});
