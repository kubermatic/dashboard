import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatSelect, MatSelectChange} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ProjectEntity} from '../../../../shared/entity/ProjectEntity';
import {ProjectService} from '../../../services';

@Component({
  selector: 'km-project-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss'],
})

export class ProjectSelectorComponent implements OnInit, OnDestroy {
  projects: ProjectEntity[];
  selectedProject: ProjectEntity;

  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _projectService: ProjectService) {}

  ngOnInit(): void {
    this._projectService.projects.pipe(takeUntil(this._unsubscribe))
        .subscribe(projects => this.projects = projects.sort((a, b) => a.name.localeCompare(b.name)));

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

  openDropdown(matSelect: MatSelect) {
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
