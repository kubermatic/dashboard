import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatSelectChange} from '@angular/material';
import {Router, RouterState, RouterStateSnapshot} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {AddProjectDialogComponent} from '../../../shared/components/add-project-dialog/add-project-dialog.component';
import {CUSTOM_LINK_ICON_CLASS_PREFIX, CustomLink, CustomLinkIcon} from '../../../shared/entity/CustomLinks';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
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
  customLinks: CustomLink[];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      public dialog: MatDialog, private api: ApiService, private router: Router, public projectService: ProjectService,
      private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.customLinks = this._appConfigService.getCustomLinks();
    this.loadProjects();

    this.projectService.selectedProjectChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      for (const i in this.projects) {
        if (this.projectService.compareProjectsEquality(this.projects[i], data)) {
          this.selectedProject = data;
          if (this.projects[i].name !== data.name) {
            this.loadProjects();
          }
          return;
        }
      }
      this.loadProjects();
      this.selectedProject = data;
    });

    this.registerProjectRefreshInterval();
  }

  private changeSelectedProject(project: ProjectEntity): void {
    this.projectService.changeAndStoreSelectedProject(project);
    this.selectedProject = project;
  }

  private registerProjectRefreshInterval(): void {
    timer(0, 1500).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      if (!!this.selectedProject && this.selectedProject.status !== 'Active') {
        this.api.getProjects().pipe(first()).subscribe((res) => {
          this.projects = res;
          for (const i in this.projects) {
            if (this.projectService.compareProjectsEquality(this.projects[i], this.selectedProject)) {
              this.changeSelectedProject(this.projects[i]);
            }
          }
        });
      }
    });
  }

  loadProjects(): void {
    this.api.getProjects().subscribe((res) => {
      this.projects = res;

      if (this.projects.length === 1) {
        this.changeSelectedProject(this.projects[0]);
        return;
      }

      const projectFromStorage = this.projectService.getProjectFromStorage();
      if (!!projectFromStorage) {
        for (const i in this.projects) {
          if (this.projectService.compareProjectsEquality(this.projects[i], projectFromStorage)) {
            this.changeSelectedProject(this.projects[i]);
          }
        }
      }
    });
  }

  selectionChange(event: MatSelectChange, previous: ProjectEntity, select: any): void {
    if (event.value === undefined) {
      // The only option with undefined value is "+ Add Project". If it gets
      // selected, we revert both the model and the control to the old value.
      this.selectedProject = previous;
      select.value = previous;
    } else {
      for (const i in this.projects) {
        if (this.projectService.compareProjectsEquality(this.projects[i], event.value)) {
          this.changeSelectedProject(this.projects[i]);
        }
      }
    }
  }

  addProject(): void {
    const modal = this.dialog.open(AddProjectDialogComponent);
    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.loadProjects();
      }
      sub.unsubscribe();
    });
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const state: RouterState = this.router.routerState;
    const snapshot: RouterStateSnapshot = state.snapshot;

    if (url === 'projects') {
      return (snapshot.url === '/' + url);
    } else {
      const selectedProjectId = this.selectedProject ? this.selectedProject.id : '';
      const urlArray = snapshot.url.split('/');
      return !!urlArray.find((x) => x === selectedProjectId) && !!urlArray.find((x) => x === url);
    }
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

  getCustomIcon(customLink: CustomLink): string {
    // If custom link icon has been set and if it is one of the allowed values it can be used.
    if (customLink.icon && Object.values(CustomLinkIcon).includes(customLink.icon)) {
      return CUSTOM_LINK_ICON_CLASS_PREFIX + customLink.icon;
    }

    // Try to detect if matching icon is available checking the label and the URL of a custom link.
    if (customLink.label) {
      for (const customLinkIcon of Object.values(CustomLinkIcon)) {
        if (customLink.label.includes(customLinkIcon)) {
          return CUSTOM_LINK_ICON_CLASS_PREFIX + customLinkIcon;
        }
      }
    }

    if (customLink.url) {
      for (const customLinkIcon of Object.values(CustomLinkIcon)) {
        if (customLink.url.includes(customLinkIcon)) {
          return CUSTOM_LINK_ICON_CLASS_PREFIX + customLinkIcon;
        }
      }
    }

    // Otherwise, return default icon.
    return CUSTOM_LINK_ICON_CLASS_PREFIX + CustomLinkIcon.Default;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
