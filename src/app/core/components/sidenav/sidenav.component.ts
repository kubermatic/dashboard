import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatSelectChange} from '@angular/material';
import {Router} from '@angular/router';
import {merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {AddProjectDialogComponent} from '../../../shared/components/add-project-dialog/add-project-dialog.component';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {CustomLink, CustomLinkLocation} from '../../../shared/utils/custom-link-utils/custom-link';
import {ApiService, ProjectService} from '../../services';

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})

export class SidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  projects: ProjectEntity[];
  selectedProject: ProjectEntity;
  customLinks: CustomLink[] = [];
  private _externalProjectsUpdate: Subject<any> = new Subject();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      public dialog: MatDialog, private api: ApiService, private router: Router, public projectService: ProjectService,
      private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.customLinks = this._appConfigService.getCustomLinks(CustomLinkLocation.Default);

    let isInitializing = true;
    merge(timer(0, 5 * this._appConfigService.getRefreshTimeBase()), this._externalProjectsUpdate)
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this.api.getProjects()))
        .subscribe(projects => {
          this.projects = projects.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          if (isInitializing) {
            isInitializing = false;

            // If there is only one project, let's select it.
            if (this.projects.length === 1) {
              this._changeSelectedProject(this.projects[0], false);
            }

            // TODO Load project from URL?

            // If no project is selected, let's use the project from the storage.
            if (!this.selectedProject) {
              const localStorageProject = this.projectService.getProjectFromStorage();
              if (!!localStorageProject) {
                this.projects.forEach(project => {
                  if (this.projectService.compareProjectsEquality(project, localStorageProject)) {
                    this._changeSelectedProject(project, false);
                  }
                });
              }
            }
          }
        });

    this.projectService.selectedProjectChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._externalProjectsUpdate.next();
      this.selectedProject = data;
    });
  }

  private _changeSelectedProject(project: ProjectEntity, changeView: boolean): void {
    this.projectService.changeAndStoreSelectedProject(project, changeView);
    this.selectedProject = project;
  }

  onSelectionChange(event: MatSelectChange, previous: ProjectEntity, select: any): void {
    if (event.value === undefined) {
      // The only option with undefined value is "+ Add Project". If it gets
      // selected, we revert both the model and the control to the old value.
      this.selectedProject = previous;
      select.value = previous;
    } else {
      // If value different than undefined was selected, let's find project
      // with matching ID and select it.
      this.projects.forEach(project => {
        if (this.projectService.compareProjectsEquality(project, event.value)) {
          this._changeSelectedProject(project, true);
        }
      });
    }
  }

  addProject(): void {
    this.dialog.open(AddProjectDialogComponent).afterClosed().pipe(first()).subscribe((added) => {
      if (added) {
        this._externalProjectsUpdate.next();
      }
    });
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
    const urlArray = this.router.routerState.snapshot.url.split('/');
    return !!urlArray.find((x) => x === selectedProjectId) &&
        (!!urlArray.find((x) => x === url) || (url === 'clusters' && !!urlArray.find((x) => x === 'wizard')));
  }

  getRouterLink(target: string): string {
    const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
    return `/projects/${selectedProjectId}/${target}`;
  }

  getTooltip(viewName: string): string {
    let tooltip: string;
    if (!this.projectService.isViewEnabled(viewName)) {
      tooltip = 'Cannot enter this view.';
      if (!this.projectService.project) {
        tooltip += ' There is no selected project.';
      } else if (this.projectService.project.status !== 'Active') {
        tooltip += ' Selected project is not active.';
      } else {
        tooltip += ' Missing required rights.';
      }
    }
    return tooltip;
  }

  isCustomLinkPanelVisible(): boolean {
    return this.customLinks && this.customLinks.length > 0;
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    return {
      'background-image': `url('${CustomLink.getIcon(link)}')`,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
