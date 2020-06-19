import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatSelect, MatSelectChange} from '@angular/material/select';
import {differenceBy} from 'lodash';
import {merge, Subject} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';

import {Project} from '../../../../shared/entity/project';
import {ProjectService} from '../../../services';
import {SettingsService} from '../../../services/settings/settings.service';

@Component({
  selector: 'km-project-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss'],
})
export class ProjectSelectorComponent implements OnInit, OnDestroy {
  @Input() showSidenav: boolean;
  myProjects: Project[] = [];
  externalProjects: Project[] = [];
  selectedProject: Project;

  private _unsubscribe: Subject<any> = new Subject();
  private _displayAllProjects: boolean;
  private _projects: Project[];

  constructor(private readonly _projectService: ProjectService, private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this._displayAllProjects = this._settingsService.defaultUserSettings.displayAllProjectsForAdmin;

    this._projectService.projects
      .pipe(tap(projects => (this._projects = projects)))
      .pipe(switchMap(_ => this._projectService.myProjects))
      .pipe(tap(projects => (this.myProjects = this._sortProjects(projects))))
      .pipe(tap(_ => (this.externalProjects = differenceBy(this._projects, this.myProjects, 'id'))))
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

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _sortProjects(projects: Project[]): Project[] {
    return projects.sort((a, b) => (a.name + a.id).localeCompare(b.name + b.id));
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
