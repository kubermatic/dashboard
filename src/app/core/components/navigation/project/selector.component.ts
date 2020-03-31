import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatSelect, MatSelectChange} from '@angular/material/select';
import {merge, Subject, timer} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../../../app-config.service';
import {ProjectEntity} from '../../../../shared/entity/ProjectEntity';
import {ProjectService} from '../../../services';

@Component({
  selector: 'km-project-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss'],
})

export class ProjectSelectorComponent implements OnInit, OnDestroy {
  @Input() showSidenav: boolean;
  projects: ProjectEntity[];
  selectedProject: ProjectEntity;

  private _unsubscribe: Subject<any> = new Subject();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(private readonly _projectService: ProjectService, private readonly _appConfig: AppConfigService) {}

  ngOnInit(): void {
    merge(this._projectService.onProjectDisplayChange, this._refreshTimer$)
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._projectService.projects))
        .subscribe(projects => this.projects = projects.sort((a, b) => (a.name + a.id).localeCompare(b.name + b.id)));

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.selectedProject = project);

    this._projectService.onProjectChange.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.selectedProject = project);
  }

  onSelectionChange(event: MatSelectChange): void {
    this.projects.forEach(project => {
      if (this.areProjectsEqual(project, event.value)) {
        this._selectProject(project);
      }
    });
  }

  openDropdown(matSelect: MatSelect): void {
    matSelect.open();
  }

  areProjectsEqual(a: ProjectEntity, b: ProjectEntity): boolean {
    return !!a && !!b && a.id === b.id;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _selectProject(project: ProjectEntity): void {
    this._projectService.selectProject(project);
    this.selectedProject = project;
  }
}
