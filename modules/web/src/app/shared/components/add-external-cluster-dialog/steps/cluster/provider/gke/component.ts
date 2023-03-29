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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ExternalClusterService} from '@core/services/external-cluster';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {MatLegacyPaginator as MatPaginator} from '@angular/material/legacy-paginator';
import {UserService} from '@core/services/user';
import {GKECluster} from '@app/shared/entity/provider/gke';

@Component({
  selector: 'km-gke-cluster-select',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class GKEClusterSelectComponent implements OnInit, OnDestroy {
  @Input() projectID: string;
  isInitialized = false;
  clusters: GKECluster[] = [];
  dataSource = new MatTableDataSource<GKECluster>();
  columns: string[] = ['name', 'zone', 'import'];
  @ViewChild(MatPaginator, {static: true}) private readonly _paginator: MatPaginator;
  private _selected: GKECluster;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _userService: UserService
  ) {}

  ngOnInit() {
    this.dataSource.paginator = this._paginator;
    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this._paginator;
    });

    this._externalClusterService
      .getGKEClusters(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters;
        this.dataSource.data = clusters;
        this.isInitialized = true;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._externalClusterService.clusterStepValidity = false;
  }

  get isEmpty(): boolean {
    return this.clusters.length === 0;
  }

  get hasPaginator(): boolean {
    return !this.isEmpty && this._paginator && this.clusters.length > this._paginator.pageSize;
  }

  isSelected(cluster: GKECluster): boolean {
    return this._selected === cluster;
  }

  select(cluster: GKECluster): void {
    this._selected = cluster;

    this._externalClusterService.clusterStepValidity = true;

    this._externalClusterService.externalCluster.name = this._selected.name;
    this._externalClusterService.externalCluster.cloud.gke.name = this._selected.name;
    this._externalClusterService.externalCluster.cloud.gke.zone = this._selected.zone;
  }
}
