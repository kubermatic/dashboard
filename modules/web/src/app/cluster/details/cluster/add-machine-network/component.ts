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

import {Component, Input} from '@angular/core';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {Cluster, ClusterPatch, MachineNetwork} from '@shared/entity/cluster';
import _ from 'lodash';
import {Observable} from 'rxjs';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-add-machine-network',
  templateUrl: './template.html',
})
export class AddMachineNetworkComponent {
  @Input() cluster: Cluster;
  @Input() projectID: string;

  machineNetworks: MachineNetwork[] = [];
  valid = false;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _dialogRef: MatDialogRef<AddMachineNetworkComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  getObservable(): Observable<Cluster> {
    return this._clusterService
      .patch(this.projectID, this.cluster.id, {
        spec: {
          machineNetworks: this.machineNetworks,
        },
      } as ClusterPatch)
      .pipe(take(1));
  }

  onNext(cluster: Cluster): void {
    this._notificationService.success(
      `Added the machine network${this.machineNetworks.length > 1 ? 's' : ''} for the ${this.cluster.name} cluster`
    );
    this._dialogRef.close(cluster);
  }
}
