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

import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {CloudSpec, Cluster, ClusterPatch, ProviderSettingsPatch} from '@shared/entity/cluster';
import {NodeProvider, NodeProviderConstants} from '@shared/model/NodeProviderConstants';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-edit-provider-settings',
  templateUrl: './template.html',
})
export class EditProviderSettingsComponent implements OnInit {
  private _unsubscribe = new Subject<void>();
  private providerSettingsPatch: ProviderSettingsPatch = {
    isValid: false,
    cloudSpecPatch: {},
  };
  @Input() cluster: Cluster;
  @Input() projectID: string;

  get canSave(): boolean {
    return this.providerSettingsPatch.isValid;
  }

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialogRef: MatDialogRef<EditProviderSettingsComponent>
  ) {}

  ngOnInit(): void {
    this._clusterService.providerSettingsPatchChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(patch => (this.providerSettingsPatch = patch));
  }

  providerDisplayName(cloud: CloudSpec): string {
    const provider = Cluster.getProvider(cloud),
      nodeProvider = Object.keys(NodeProvider)[(Object.values(NodeProvider) as string[]).indexOf(provider)];
    return NodeProviderConstants.displayName(NodeProvider[nodeProvider]);
  }

  onSettingsSave(): void {
    const patch: ClusterPatch = {
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
      },
    };

    this._clusterService.patch(this.projectID, this.cluster.id, patch).subscribe(cluster => {
      this._matDialogRef.close(cluster);
      this._clusterService.onClusterUpdate.next();
      this._notificationService.success(`The ${this.cluster.name} cluster was updated`);
    });
  }
}
