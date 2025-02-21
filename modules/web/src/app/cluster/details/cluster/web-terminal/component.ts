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

import {Component, ViewEncapsulation} from '@angular/core';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {ActivatedRoute, Router} from '@angular/router';
import {DatacenterService} from '@core/services/datacenter';
import {ClusterService} from '@core/services/cluster';
import {PathParam} from '@core/services/params';
import {take} from 'rxjs/operators';
import {LayoutType} from '@shared/model/Terminal';

@Component({
    selector: 'km-web-terminal',
    templateUrl: './template.html',
    styleUrls: ['style.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class WebTerminalComponent {
  readonly layoutType = LayoutType;

  cluster: Cluster;
  datacenter: Datacenter;
  projectID: string;

  private _clusterName: string;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _datacenterService: DatacenterService,
    private readonly _clusterService: ClusterService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this.projectID = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this._clusterName = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);
    this.loadCluster();
  }

  loadCluster(): void {
    this._clusterService
      .cluster(this.projectID, this._clusterName)
      .pipe(take(1))
      .subscribe((cluster: Cluster) => {
        this.cluster = cluster;
        this._isClusterLoaded = true;
        this.loadDatacenter();
      });
  }

  loadDatacenter(): void {
    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(take(1))
      .subscribe((dataCenter: Datacenter) => {
        this.datacenter = dataCenter;
        this._isDatacenterLoaded = true;
      });
  }

  isInitialized(): boolean {
    return this._isClusterLoaded && this._isDatacenterLoaded;
  }

  goBack() {
    this._router.navigate(['../'], {relativeTo: this._activatedRoute});
  }
}
