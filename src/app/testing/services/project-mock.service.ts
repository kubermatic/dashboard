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

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {Project} from '@shared/entity/project';
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

  delete(_projectID: string): Observable<any> {
    return of(null);
  }
}
