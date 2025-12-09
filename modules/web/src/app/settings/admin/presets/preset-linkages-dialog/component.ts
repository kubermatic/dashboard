// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {PresetsService} from '@core/services/wizard/presets';
import {ClusterAssociation, ClusterTemplateAssociation, PresetLinkages} from '@shared/entity/preset';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';

export interface PresetLinkagesDialogData {
  presetName: string;
}

enum Column {
  Name = 'name',
  Type = 'type',
  ProjectName = 'projectName',
  Provider = 'provider',
}

enum ResourceType {
  Cluster = 'Cluster',
  Template = 'Template',
}

/**
 * Combines clusters and templates into a single table view with type distinction
 */
export interface PresetResource {
  type: ResourceType;
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  provider: string;
}

@Component({
  selector: 'km-preset-linkages-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class PresetLinkagesDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly Column = Column;
  readonly ResourceType = ResourceType;
  readonly displayedColumns: string[] = Object.values(Column);

  isLoading = false;
  presetLinkages: PresetLinkages;
  dataSource = new MatTableDataSource<PresetResource>();

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  private readonly _unsubscribe = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PresetLinkagesDialogData,
    public readonly _dialogRef: MatDialogRef<PresetLinkagesDialogComponent>,
    private readonly _presetsService: PresetsService,
    private readonly _notificationService: NotificationService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _router: Router,
    private readonly _userService: UserService
  ) {}

  get presetName(): string {
    return this.data.presetName;
  }

  get totalCount(): number {
    return this.presetLinkages
      ? (this.presetLinkages.clusters?.length || 0) + (this.presetLinkages.clusterTemplates?.length || 0)
      : 0;
  }

  ngOnInit(): void {
    this._loadLinkages();

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (this.paginator) {
        this.paginator.pageSize = settings.itemsPerPage;
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  ngAfterViewInit(): void {
    this._setupTableControls();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next(true);
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return this.presetLinkages && this.totalCount > 0 && this.paginator && this.totalCount > this.paginator.pageSize;
  }

  navigateToResource(resource: PresetResource): void {
    if (resource.type === ResourceType.Cluster) {
      const url = this._router.serializeUrl(
        this._router.createUrlTree([`/projects/${resource.projectId}/clusters/${resource.id}`])
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const url = this._router.serializeUrl(
        this._router.createUrlTree([`/projects/${resource.projectId}/clustertemplates`])
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  private _setupTableControls(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case Column.Type:
          return item.type;
        case Column.Name:
          return item.name;
        case Column.ProjectName:
          return item.projectName;
        case Column.Provider:
          return item.provider;
        default:
          return item[property];
      }
    };

    this._cdr.detectChanges();
  }

  private _loadLinkages(): void {
    this.isLoading = true;
    this._presetsService
      .getPresetLinkages(this.presetName)
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: (linkages: PresetLinkages) => {
          this.presetLinkages = linkages;
          this._mergeDataSources(linkages);
          this._cdr.detectChanges();
        },
        error: () => {
          this._notificationService.error(`Failed to load linkages for preset ${this.presetName}`);
        },
      });
  }

  private _mergeDataSources(linkages: PresetLinkages): void {
    const clusters =
      linkages.clusters?.map((cluster: ClusterAssociation) => ({
        type: ResourceType.Cluster,
        id: cluster.clusterId,
        name: cluster.clusterName,
        projectId: cluster.projectId,
        projectName: cluster.projectName,
        provider: cluster.provider,
      })) || [];

    const templates =
      linkages.clusterTemplates?.map((template: ClusterTemplateAssociation) => ({
        type: ResourceType.Template,
        id: template.templateId,
        name: template.templateName,
        projectId: template.projectId,
        projectName: template.projectName,
        provider: template.provider,
      })) || [];

    this.dataSource.data = [...clusters, ...templates];
  }
}
