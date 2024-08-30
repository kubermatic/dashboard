// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ApplicationService} from '@app/core/services/application';
import {DatacenterService} from '@app/core/services/datacenter';
import {NotificationService} from '@app/core/services/notification';
import {UserService} from '@app/core/services/user';
import {ApplicationAnnotations, ApplicationDefinition} from '@app/shared/entity/application';
import {Datacenter} from '@app/shared/entity/datacenter';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-applications',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class ApplicationsComponent implements OnInit, OnChanges {
  applications: ApplicationDefinition[] = [];
  isLoading = false;
  currentApplication: ApplicationDefinition;
  dataSource = new MatTableDataSource<ApplicationDefinition>();
  displayedColumns: string[] = ['name', 'default', 'enforce', 'datacenters'];
  datacenters: Datacenter[] = [];
  applicationDatacenters: Map<string, string[]> = new Map();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _applicationService: ApplicationService,
    private readonly _datacenterService: DatacenterService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.dataSource.data = this.applications;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
    this.isLoading = true;

    this._applicationService
      .applicationDefinitions()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: applications => {
          this.applications = this._filter(applications);
          this.dataSource.data = this.applications;
          this.applicationDatacenters = new Map(
            this.applications.map(app => {
              const datacenters = app.annotations?.[ApplicationAnnotations.TargetDatacenters]?.split(',') || [];
              return [app.name, datacenters];
            })
          );
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
        complete: () => (this.isLoading = false),
      });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._datacenterService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      this.datacenters = datacenters;
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.applications;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  isPaginatorVisible(): boolean {
    return (
      this.applications &&
      this.applications.length > 0 &&
      this.paginator &&
      this.applications.length > this.paginator.pageSize
    );
  }

  private _filter(applications: ApplicationDefinition[]): ApplicationDefinition[] {
    const notEmpty = (application: ApplicationDefinition) => !!application.name;
    return applications.filter(notEmpty);
  }

  onDefaultChange(event: MatSlideToggleChange, application: ApplicationDefinition): void {
    const newDefaultValue = event.checked;

    if (newDefaultValue) {
      application.annotations[ApplicationAnnotations.Default] = 'true';
    } else {
      delete application.annotations[ApplicationAnnotations.Default];
    }

    this.patchApplication(application);
  }

  onEnforceChange(event: MatSlideToggleChange, application: ApplicationDefinition): void {
    const newDefaultValue = event.checked;

    if (newDefaultValue) {
      application.annotations[ApplicationAnnotations.Enforce] = 'true';
    } else {
      delete application.annotations[ApplicationAnnotations.Enforce];
    }

    this.patchApplication(application);
  }

  onDatacentersChange(dc: string[], application: ApplicationDefinition): void {
    const newDatacenters = dc;

    if (newDatacenters && newDatacenters.length > 0) {
      application.annotations[ApplicationAnnotations.TargetDatacenters] = newDatacenters.join(',');
    } else {
      delete application.annotations[ApplicationAnnotations.TargetDatacenters];
    }

    this.applicationDatacenters.set(application.name, newDatacenters);
    this.patchApplication(application);
  }

  patchApplication(application: ApplicationDefinition): void {
    this._applicationService
      .patchApplicationDefinition(application.name, application)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: updatedApplication => {
          // Update the local data
          const index = this.applications.findIndex(app => app.name === updatedApplication.name);
          if (index !== -1) {
            this.applications[index] = updatedApplication;
            this.dataSource.data = [...this.applications];
          }
        },
        error: _ => this._notificationService.error('Could not patch the application definition'),
      });
  }

  defaultApplication(app: ApplicationDefinition): boolean {
    return app.annotations?.[ApplicationAnnotations.Default] === 'true';
  }

  enforceApplication(app: ApplicationDefinition): boolean {
    return app.annotations?.[ApplicationAnnotations.Enforce] === 'true';
  }

  targetDatacenters(app: ApplicationDefinition): string[] {
    return app.annotations?.[ApplicationAnnotations.TargetDatacenters]?.split(',') || [];
  }
}
