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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatSelect, MatSelectChange} from '@angular/material/select';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Project} from '@shared/entity/project';
import _, {differenceBy} from 'lodash';
import {Subject, merge} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
  selector: 'km-project-selector',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ProjectSelectorComponent implements OnInit, OnDestroy {
  @Input() showSidenav: boolean;
  myProjects: Project[] = [];
  externalProjects: Project[] = [];
  selectedProject: Project;

  private _unsubscribe: Subject<void> = new Subject<void>();
  private _displayAllProjects: boolean;
  private _projects: Project[];

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this._displayAllProjects = this._userService.defaultUserSettings.displayAllProjectsForAdmin;

    this._projectService.projects
      .pipe(tap(projects => (this._projects = projects)))
      .pipe(switchMap(_ => this._projectService.myProjects))
      .pipe(tap(projects => (this.myProjects = this._sortProjects(projects))))
      .pipe(tap(_ => (this.externalProjects = this._sortProjects(differenceBy(this._projects, this.myProjects, 'id')))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._appendProject(this.selectedProject));

    merge(this._projectService.selectedProject, this._projectService.onProjectChange)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((project: Project) => this._appendProject((this.selectedProject = project)));
  }

  onSelectionChange(event: MatSelectChange): void {
    [...this.myProjects, ...this.externalProjects].forEach(project => {
      if (this.areProjectsEqual(project, event.value)) {
        this._selectProject(project);
      }
    });
  }

  openDropdown(matSelect: MatSelect): void {
    matSelect.open();
  }

  areProjectsEqual(a: Project, b: Project): boolean {
    return !!a && !!b && a.id === b.id;
  }

  trackByProject(_: number, project: Project): string {
    return project.id;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _sortProjects(projects: Project[]): Project[] {
    return _.sortBy(
      projects,
      p => p.name.toLowerCase(),
      p => p.id.toLowerCase()
    );
  }

  private _appendProject(project: Project): void {
    if (!project) {
      return;
    }

    const found = this.myProjects.find(p => this.areProjectsEqual(p, project));
    if (!found && this.externalProjects.length === 0 && !this._displayAllProjects) {
      this.externalProjects = [project];
    }
  }

  private _selectProject(project: Project): void {
    this._projectService.selectProject(project);
    this._projectService.onProjectsUpdate.next();
    this.selectedProject = project;
  }
}
