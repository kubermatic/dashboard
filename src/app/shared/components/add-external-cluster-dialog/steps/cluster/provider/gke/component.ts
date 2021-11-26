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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {GKECluster} from '@shared/entity/external-cluster';

@Component({
  selector: 'km-gke-cluster',
  templateUrl: './template.html',
})
export class GKEClusterComponent implements OnInit, OnDestroy {
  clusters: GKECluster[];
  isLoading = true;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _externalClusterService: ExternalClusterService) {}

  ngOnInit() {
    this._externalClusterService
      .getGKEClusters()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters;
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  update(): void {
    this._externalClusterService.externalCluster.name = '';
    this._externalClusterService.externalCluster.cloud.gke.name = '';
  }
}
