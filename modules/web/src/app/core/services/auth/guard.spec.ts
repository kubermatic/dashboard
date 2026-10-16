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

import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot} from '@angular/router';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {fakeProject} from '@test/data/project';
import {Observable, of, throwError} from 'rxjs';
import {Project} from '@shared/entity/project';
import {ProjectIDGuard} from './guard';

describe('ProjectIDGuard', () => {
  let guard: ProjectIDGuard;
  let parseUrl: jest.Mock;
  let getProject: jest.Mock;

  function snapshotFor(projectID: string): ActivatedRouteSnapshot {
    return {paramMap: convertToParamMap({[PathParam.ProjectID]: projectID})} as ActivatedRouteSnapshot;
  }

  function activate(projectID: string): boolean | string {
    let result: boolean | string;
    (guard.canActivate(snapshotFor(projectID), {} as RouterStateSnapshot) as Observable<boolean | string>).subscribe(
      value => (result = value as boolean | string)
    );
    return result;
  }

  beforeEach(() => {
    parseUrl = jest.fn(url => url);
    getProject = jest.fn(() => of(fakeProject()));
    TestBed.configureTestingModule({
      providers: [
        ProjectIDGuard,
        {provide: Router, useValue: {parseUrl}},
        {provide: ProjectService, useValue: {getProject}},
      ],
      teardown: {destroyAfterEach: false},
    });
    guard = TestBed.inject(ProjectIDGuard);
  });

  it('should redirect to the project list for an unusable project id', () => {
    const unusableProjectIDs = ['undefined', 'null', '', '  '];
    unusableProjectIDs.forEach(projectID => expect(activate(projectID)).toBe('/projects'));

    expect(parseUrl).toHaveBeenCalledTimes(unusableProjectIDs.length);
    expect(parseUrl).toHaveBeenCalledWith('/projects');
    expect(getProject).not.toHaveBeenCalled();
  });

  it('should allow a project id that resolves', () => {
    expect(activate(fakeProject().id)).toBe(true);
    expect(getProject).toHaveBeenCalledWith(fakeProject().id);
    expect(parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to the project list for a project id that does not resolve', () => {
    getProject.mockReturnValue(throwError(() => new Error('404')) as Observable<Project>);

    expect(activate('does-not-exist')).toBe('/projects');
    expect(parseUrl).toHaveBeenCalledWith('/projects');
  });
});
