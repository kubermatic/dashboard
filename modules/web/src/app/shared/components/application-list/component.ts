// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {MatSort} from '@angular/material/sort';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {ApplicationService} from '@core/services/application';
import {AddApplicationDialogComponent} from '@shared/components/application-list/add-application-dialog/component';
import {EditApplicationDialogComponent} from '@shared/components/application-list/edit-application-dialog/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Application, ApplicationDefinition, ApplicationLabel, ApplicationLabelValue} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {getEditionVersion} from '@shared/utils/common';
import {StatusIcon} from '@shared/utils/health-status';
import _ from 'lodash';
import {forkJoin, of, Subject} from 'rxjs';
import {finalize, map, take, takeUntil} from 'rxjs/operators';

export enum ApplicationsListView {
  Default,
  Wizard,
  Summary,
}

type ApplicationMethodMap = {
  [key: string]: {[key: string]: string};
};

type ApplicationSourceMap = ApplicationMethodMap;
type ApplicationStatusMap = {
  [key: string]: {
    [key: string]: {
      icon: string;
      message: string;
    };
  };
};

enum Column {
  Status = 'status',
  Name = 'name',
  Application = 'application',
  Version = 'version',
  Method = 'method',
  Source = 'source',
  Namespace = 'namespace',
  Added = 'added',
  Actions = 'actions',
}

@Component({
  selector: 'km-application-list',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  @Input() applications: Application[] = [];
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterReady = true;
  @Input() canEdit = true;
  @Input() view: ApplicationsListView = ApplicationsListView.Default;

  @Output() addApplication = new EventEmitter<Application>();
  @Output() editApplication = new EventEmitter<Application>();
  @Output() deleteApplication = new EventEmitter<Application>();

  readonly ApplicationListView = ApplicationsListView;
  readonly Column = Column;
  readonly displayedColumns: string[] = [
    Column.Status,
    Column.Name,
    Column.Application,
    Column.Version,
    Column.Method,
    Column.Source,
    Column.Namespace,
    Column.Added,
    Column.Actions,
  ];
  showCards = true;
  applicationDefinitions: ApplicationDefinition[] = [];
  applicationDefinitionsMap = new Map<string, ApplicationDefinition>();
  applicationsDataSource = new MatTableDataSource<Application>();
  sort: MatSort;
  applicationsMethodMap: ApplicationMethodMap = {};
  applicationsSourceMap: ApplicationSourceMap = {};
  applicationsStatusMap: ApplicationStatusMap = {};
  editionVersion: string = getEditionVersion();
  showSystemApplications = false;

  private readonly _unsubscribe: Subject<void> = new Subject<void>();

  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    this.sort = ms;
    this.applicationsDataSource.sort = this.sort;
  }

  constructor(
    private readonly _applicationService: ApplicationService,
    private readonly _matDialog: MatDialog,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this._initSubscriptions();

    this.applicationsDataSource.data = this._visibleApplications;
    this.applicationsDataSource.filterPredicate = this._filter.bind(this);
    this.applicationsDataSource.filter = '';
    this.applicationsDataSource.sortingDataAccessor = (item: Application, property) => {
      switch (property) {
        case Column.Name:
          return item.name;
        case Column.Application:
          return item.spec.applicationRef.name;
        case Column.Namespace:
          return item.spec.namespace?.name;
        default:
          return '';
      }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.applications) {
      if (!changes.applications.currentValue) {
        this.applications = [];
      }
      this.applicationsDataSource.data = this._visibleApplications;
      if (this.applicationDefinitions?.length) {
        this._updateApplicationMaps();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearchQueryChanged(query: string): void {
    this.applicationsDataSource.filter = query;
  }

  changeView(): void {
    this.showCards = !this.showCards;
  }

  toggleSystemApplications() {
    this.showSystemApplications = !this.showSystemApplications;
    this.applicationsDataSource.data = this._visibleApplications;
  }

  getAddBtnTooltip(): string {
    if (!this.canEdit) {
      return 'You have no permissions to edit applications in this cluster.';
    } else if (this.applicationDefinitions.length === 0) {
      return 'There are no application available.';
    }
    return '';
  }

  isSystemApplication(application: Application): boolean {
    return application.labels?.[ApplicationLabel.ManagedBy] === ApplicationLabelValue.KKP;
  }

  onAddApplication(): void {
    if (this._canAdd()) {
      const dialog = this._matDialog.open(AddApplicationDialogComponent);
      dialog.componentInstance.installedApplications = this.applications;
      dialog.componentInstance.applicationDefinitions = this.applicationDefinitions;
      dialog.componentInstance.applicationDefinitionsMap = this.applicationDefinitionsMap;
      dialog
        .afterClosed()
        .pipe(take(1))
        .subscribe((dialogData: [Application, ApplicationDefinition]) => {
          if (dialogData) {
            const addedApplication = dialogData[0];
            const selectedAppDef = dialogData[1];
            if (selectedAppDef) {
              this._updateApplicationDefinition(selectedAppDef);
            }
            if (addedApplication) {
              this.addApplication.emit(addedApplication);
            }
          }
        });
    }
  }

  onEditApplication(application: Application): void {
    const dialog = this._matDialog.open(EditApplicationDialogComponent);
    this._dialogModeService.isEditDialog = true;
    dialog.componentInstance.application = application;
    dialog.componentInstance.installedApplications = this.applications.filter(
      item => item.name !== application.name || item.spec.namespace.name !== application.spec.namespace.name
    );
    dialog.componentInstance.applicationDefinition = this.applicationDefinitionsMap.get(
      application.spec.applicationRef.name
    );
    dialog.componentInstance.cluster = this.cluster;
    dialog.componentInstance.projectID = this.projectID;
    dialog
      .afterClosed()
      .pipe(
        finalize(() => {
          this._dialogModeService.isEditDialog = false;
        }),
        take(1)
      )
      .subscribe(editedApplication => {
        if (editedApplication) {
          this.editApplication.emit(editedApplication);
        }
      });
  }

  onDeleteApplication(application: Application): void {
    if (!this.isSystemApplication(application)) {
      const config: MatDialogConfig = {
        data: {
          title: 'Delete Application',
          message: `Delete <b>${application.name}</b> application${
            this.cluster ? ` of <b>${this.cluster.name}</b> cluster permanently` : ''
          }?`,
          confirmLabel: 'Delete',
        },
      };

      this._matDialog
        .open(ConfirmationDialogComponent, config)
        .afterClosed()
        .pipe(take(1))
        .subscribe(isConfirmed => {
          if (isConfirmed) {
            this.deleteApplication.emit(application);
          }
        });
    }
  }

  private get _visibleApplications(): Application[] {
    let filteredApplications = this.applications || [];
    if (!this.showSystemApplications) {
      filteredApplications = filteredApplications.filter(application => !this.isSystemApplication(application));
    }
    return filteredApplications;
  }

  private _initSubscriptions(): void {
    this._applicationService
      .applicationDefinitions()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(applicationDefinitions => {
        this._updateApplicationDefinitions(applicationDefinitions);
        this._updateApplicationMaps();
      });
  }

  private _updateApplicationDefinition(updatedAppDef: ApplicationDefinition): void {
    const updatedAppDefs = this.applicationDefinitions.map(appDef => {
      if (appDef.name === updatedAppDef.name) {
        return _.merge(appDef, updatedAppDef);
      }
      return appDef;
    });
    this._updateApplicationDefinitions(updatedAppDefs);
  }

  private _updateApplicationDefinitions(applicationDefinitions: ApplicationDefinition[]): void {
    const updatedMap = new Map();
    this.applicationDefinitions = applicationDefinitions.map(appDef => {
      if (this.applicationDefinitionsMap.has(appDef.name)) {
        appDef = _.merge(this.applicationDefinitionsMap.get(appDef.name), appDef);
      }
      updatedMap.set(appDef.name, appDef);
      return appDef;
    });
    this.applicationDefinitionsMap = updatedMap;
  }

  private _updateApplicationMaps(): void {
    const loadingAppDefDetails: Record<string, boolean> = {};
    // load application definition details
    forkJoin(
      this.applications.map(application => {
        const applicationRef = application.spec.applicationRef;
        if (
          !application.status &&
          applicationRef &&
          !this.applicationDefinitionsMap.get(applicationRef.name)?.spec?.versions &&
          !loadingAppDefDetails[applicationRef.name]
        ) {
          loadingAppDefDetails[applicationRef.name] = true;
          return this._applicationService.getApplicationDefinition(applicationRef.name).pipe(
            map(appDef => {
              this._updateApplicationDefinition(appDef);
              return application;
            })
          );
        }
        return of(application);
      })
    )
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.applicationsMethodMap = {};
        this.applicationsSourceMap = {};
        this.applicationsStatusMap = {};
        // eslint-disable-next-line complexity
        this.applications.forEach(application => {
          const applicationRef = application.spec.applicationRef;
          const status = application.status;
          const namespace = application.spec.namespace.name;

          this.applicationsMethodMap = {
            ...this.applicationsMethodMap,
            [namespace]: {
              ...(this.applicationsMethodMap[namespace] || {}),
              [application.name]:
                status?.method || this.applicationDefinitionsMap.get(applicationRef?.name)?.spec.method,
            },
          };

          const versionSources =
            status?.applicationVersion?.template?.source ||
            this.applicationDefinitionsMap
              .get(applicationRef?.name)
              ?.spec.versions?.find(version => version.version === applicationRef?.version)?.template?.source;

          this.applicationsSourceMap = {
            ...this.applicationsSourceMap,
            [namespace]: {
              ...(this.applicationsSourceMap[namespace] || {}),
              [application.name]: versionSources ? Object.keys(versionSources).find(key => !!versionSources[key]) : '',
            },
          };
          if (status) {
            let icon = StatusIcon.Pending;
            let message = '';
            if (application.deletionTimestamp) {
              icon = StatusIcon.Error;
              message = 'Deleting';
            }
            if (status.conditions?.length) {
              const failingCondition = status.conditions.find(condition => condition.status === 'False');
              const unknownCondition = status.conditions.find(condition => condition.status === 'Unknown');
              if (failingCondition) {
                icon = StatusIcon.Error;
                const error = failingCondition.message;
                message = `${error} ${
                  error || !error.endsWith('.') ? '.' : ''
                } Please check your configuration or contact your KKP Administrator.`;
              } else if (unknownCondition) {
                icon = StatusIcon.Warning;
                const warning = unknownCondition.message;
                message = `${warning} ${
                  warning || !warning.endsWith('.') ? '.' : ''
                } Application is in an unknown state.`;
              } else {
                icon = StatusIcon.Running;
                message = 'Ready';
              }
            }
            this.applicationsStatusMap = {
              ...this.applicationsStatusMap,
              [namespace]: {
                ...(this.applicationsStatusMap[namespace] || {}),
                [application.name]: {icon, message},
              },
            };
          }
        });
      });
  }

  private _canAdd(): boolean {
    return this.isClusterReady && this.canEdit && !_.isEmpty(this.applicationDefinitions);
  }

  private _filter(application: Application, query: string): boolean {
    query = query.toLowerCase();
    return (
      application.name.toLowerCase().includes(query) || application.spec.namespace?.name?.toLowerCase().includes(query)
    );
  }
}
