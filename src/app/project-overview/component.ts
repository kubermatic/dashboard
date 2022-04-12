// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Project} from '@shared/entity/project';
import {ProjectService} from '@core/services/project';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'km-project-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProjectOverviewComponent implements OnInit, OnDestroy {
  project: Project;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _projectService: ProjectService) {}

  ngOnInit(): void {
    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(p => (this.project = p));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
