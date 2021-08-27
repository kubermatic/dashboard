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
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {shrinkGrow} from '@shared/animations/grow';
import {NotificationService} from '@core/services/notification';
import {Router} from '@angular/router';

class ClusterFromTemplateDialogData {
  template: ClusterTemplate;
  projectID: string;
}

enum Control {
  Replicas = 'replicas',
}

@Component({
  selector: 'km-cluster-from-template-dialog',
  templateUrl: './template.html',
  animations: [shrinkGrow],
})
export class ClusterFromTemplateDialogComponent implements OnInit {
  control = Control;
  datacenter: Datacenter;
  seedSettings: SeedSettings;
  form: FormGroup;
  showDetails = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ClusterFromTemplateDialogData,
    public dialogRef: MatDialogRef<ClusterFromTemplateDialogComponent>,
    private readonly _router: Router,
    private readonly _datacenterService: DatacenterService,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit() {
    this._datacenterService
      .getDatacenter(this.data.template.cluster.spec.cloud.dc)
      .pipe(tap(dc => (this.datacenter = dc)))
      .pipe(switchMap(dc => this._datacenterService.seedSettings(dc.spec.seed)))
      .pipe(take(1))
      .subscribe(seedSettings => (this.seedSettings = seedSettings));

    this.form = new FormGroup({[Control.Replicas]: new FormControl(1, [Validators.required, Validators.min(1)])});
  }

  create(): void {
    const replicas = this.form.get(Control.Replicas).value;
    this._clusterTemplateService
      .createInstances(replicas, this.data.projectID, this.data.template.id)
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(
          `Successfully created ${replicas} instance${replicas > 1 ? 's' : ''} from ${this.data.template.name} template`
        );
        this.dialogRef.close();
        this._router.navigate([`/projects/${this.data.projectID}/clusters`]);
      });
  }
}
