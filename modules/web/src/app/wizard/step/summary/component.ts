// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {Application} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {SSHKey} from '@shared/entity/ssh-key';
import {Subject} from 'rxjs';
import {take, switchMap, takeUntil, tap} from 'rxjs/operators';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';

@Component({
  selector: 'km-wizard-summary-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SummaryStepComponent implements OnInit, OnDestroy {
  @Input() applications: Application[] = [];

  datacenter: Datacenter;
  seedSettings: SeedSettings;
  private _sshKeys: SSHKey[] = [];
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _datacenterService: DatacenterService
  ) {}

  ngOnInit(): void {
    this._clusterSpecService.sshKeyChanges.pipe(takeUntil(this._unsubscribe)).subscribe(keys => (this._sshKeys = keys));

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => (this.datacenter = dc)))
      .pipe(switchMap(dc => this._datacenterService.seedSettings(dc.spec.seed)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(seedSettings => (this.seedSettings = seedSettings));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get cluster(): Cluster {
    return this._clusterSpecService.cluster;
  }

  get machineDeployment(): MachineDeployment {
    const data = this._nodeDataService.nodeData;
    const md: MachineDeployment = {
      name: data.name,
      spec: {
        template: data.spec,
        replicas: data.count,
        dynamicConfig: data.dynamicConfig,
      },
    };
    if (data.operatingSystemProfile && this._clusterSpecService.cluster.spec.enableOperatingSystemManager) {
      md.annotations = {
        [OPERATING_SYSTEM_PROFILE_ANNOTATION]: data.operatingSystemProfile,
      };
    }
    return md;
  }

  get sshKeys(): string[] {
    return this._sshKeys.map(key => key.name);
  }
}
