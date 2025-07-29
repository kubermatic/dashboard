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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApplicationService} from '@core/services/application';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {Application, isSystemApplication} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {MachineDeployment, OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';
import {SSHKey} from '@shared/entity/ssh-key';
import {Subject} from 'rxjs';
import {switchMap, take, takeUntil, tap} from 'rxjs/operators';

@Component({
  selector: 'km-wizard-summary-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class SummaryStepComponent implements OnInit, OnDestroy {
  datacenter: Datacenter;
  seedSettings: SeedSettings;
  private _sshKeys: SSHKey[] = [];
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _datacenterService: DatacenterService,
    private readonly _applicationService: ApplicationService
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

  get clusterTemplateEditMode(): boolean {
    return this._clusterSpecService.clusterTemplateEditMode;
  }

  get applications(): Application[] {
    return this._applicationService.applications.filter(app => !isSystemApplication(app.labels));
  }

  get machineDeployment(): MachineDeployment {
    const data = this._nodeDataService.nodeData;
    const md: MachineDeployment = {
      name: data.name,
      annotations: data.annotations,
      spec: {
        template: data.spec,
        replicas: data.count,
        dynamicConfig: data.dynamicConfig,
        minReplicas: data.minReplicas,
        maxReplicas: data.maxReplicas,
      },
    };
    if (data.operatingSystemProfile) {
      md.annotations = {
        ...md.annotations,
        [OPERATING_SYSTEM_PROFILE_ANNOTATION]: data.operatingSystemProfile,
      };
    }
    return md;
  }

  get sshKeys(): string[] {
    return this._sshKeys.map(key => key.name);
  }
}
