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
import {PresetsService} from '@core/services/wizard/presets';
import {ClusterAssociation, ClusterTemplateAssociation, PresetLinkages} from '@shared/entity/preset';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';

export interface PresetLinkagesDialogData {
  presetName: string;
}

enum ClusterColumn {
  ClusterName = 'clusterName',
  ProjectName = 'projectName',
  Provider = 'provider',
  Datacenter = 'datacenter',
}

enum TemplateColumn {
  TemplateName = 'templateName',
  ProjectName = 'projectName',
  Provider = 'provider',
  Datacenter = 'datacenter',
}

@Component({
  selector: 'km-preset-linkages-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class PresetLinkagesDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly ClusterColumn = ClusterColumn;
  readonly TemplateColumn = TemplateColumn;
  readonly defaultPageSize = 5;
  readonly pageSizeOptions: number[] = [5, 10, 25, 50];
  readonly clusterDisplayedColumns: string[] = Object.values(ClusterColumn);
  readonly templateDisplayedColumns: string[] = Object.values(TemplateColumn);

  isLoading = false;
  presetLinkages: PresetLinkages;
  clustersDataSource = new MatTableDataSource<ClusterAssociation>();
  templatesDataSource = new MatTableDataSource<ClusterTemplateAssociation>();

  @ViewChild('clustersPaginator', {static: true}) clustersPaginator: MatPaginator;
  @ViewChild('templatesPaginator', {static: true}) templatesPaginator: MatPaginator;

  @ViewChild('clustersSort', {static: true}) clustersSort: MatSort;
  @ViewChild('templatesSort', {static: true}) templatesSort: MatSort;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PresetLinkagesDialogData,
    public readonly _dialogRef: MatDialogRef<PresetLinkagesDialogComponent>,
    private readonly _presetsService: PresetsService,
    private readonly _notificationService: NotificationService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _router: Router
  ) {
  }

  get presetName(): string {
    return this.data.presetName;
  }

  get clustersCount(): number {
    return this.presetLinkages?.clusters?.length || 0;
  }

  get templatesCount(): number {
    return this.presetLinkages?.clusterTemplates?.length || 0;
  }

  ngOnInit(): void {
    this._loadLinkages();
  }

  ngAfterViewInit(): void {
    this._setupTableControls();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  navigateToCluster(cluster: ClusterAssociation): void {
    const url = this._router.serializeUrl(
      this._router.createUrlTree([`/projects/${cluster.projectId}/clusters/${cluster.clusterId}`])
    );
    window.open(url, '_blank');
  }

  navigateToClusterTemplates(template: ClusterTemplateAssociation): void {
    const url = this._router.serializeUrl(
      this._router.createUrlTree([`/projects/${template.projectId}/clustertemplates`])
    );
    window.open(url, '_blank');
  }

  private _setupTableControls(): void {
    if (this.clustersPaginator) {
      this.clustersPaginator.pageSize = this.defaultPageSize;
      this.clustersPaginator.pageSizeOptions = this.pageSizeOptions;
      this.clustersDataSource.paginator = this.clustersPaginator;
    }

    if (this.templatesPaginator) {
      this.templatesPaginator.pageSize = this.defaultPageSize;
      this.templatesPaginator.pageSizeOptions = this.pageSizeOptions;
      this.templatesDataSource.paginator = this.templatesPaginator;
    }

    // Set up sorting
    if (this.clustersSort) {
      this.clustersDataSource.sort = this.clustersSort;
    }

    if (this.templatesSort) {
      this.templatesDataSource.sort = this.templatesSort;
    }

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
          this.clustersDataSource.data = linkages.clusters || [];
          this.templatesDataSource.data = linkages.clusterTemplates || [];
          this._cdr.detectChanges();
        },
        error: () => {
          this._notificationService.error(`Failed to load linkages for preset ${this.presetName}`);
        },
      });
  }
}
