// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {Cluster, KubevirtCloudSpecPatch, KubeVirtPreAllocatedDataVolume} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {KubeVirtStorageClass} from '@shared/entity/provider/kubevirt';
import _ from 'lodash';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-kubevirt-edit-cluster',
  templateUrl: './template.html',
})
export class KubeVirtEditClusterComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() datacenter: Datacenter;
  @Output() cloudSpecChange = new EventEmitter<KubevirtCloudSpecPatch>();

  customImages: KubeVirtPreAllocatedDataVolume[];
  storageClasses: KubeVirtStorageClass[];

  constructor(private readonly _kubeVirtService: KubeVirtService) {}

  ngOnInit(): void {
    this.customImages = _.cloneDeep(this.cluster.spec.cloud.kubevirt?.preAllocatedDataVolumes || []);

    this._kubeVirtService
      .getStorageClasses(this.projectID, this.cluster.id)
      .pipe(take(1))
      .subscribe({
        next: storageClasses => {
          this.storageClasses = storageClasses;
        },
      });
  }

  onKubeVirtCustomImagesChange(customImages: KubeVirtPreAllocatedDataVolume[]): void {
    this.customImages = customImages;
    this.cloudSpecChange.emit(this._getCloudSpecPatch());
  }

  private _getCloudSpecPatch(): KubevirtCloudSpecPatch {
    return {
      preAllocatedDataVolumes: this.customImages?.length ? this.customImages : null,
    };
  }
}
