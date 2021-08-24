// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {switchMap, take, tap} from 'rxjs/operators';
import {DatacenterService} from '@core/services/datacenter';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';

@Component({
  selector: 'km-cluster-from-template-dialog',
  templateUrl: './template.html',
})
export class ClusterFromTemplateDialogComponent implements OnInit {
  datacenter: Datacenter;
  seedSettings: SeedSettings;

  constructor(
    public dialogRef: MatDialogRef<ClusterFromTemplateDialogComponent>,
    private readonly _datacenterService: DatacenterService,
    @Inject(MAT_DIALOG_DATA) public data: ClusterTemplate
  ) {}

  ngOnInit() {
    this._datacenterService
      .getDatacenter(this.data.cluster.spec.cloud.dc)
      .pipe(tap(dc => (this.datacenter = dc)))
      .pipe(switchMap(dc => this._datacenterService.seedSettings(dc.spec.seed)))
      .pipe(take(1))
      .subscribe(seedSettings => (this.seedSettings = seedSettings));
  }
}
