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

import {Component, Input} from '@angular/core';
import {Cluster} from '../../../shared/entity/cluster';
import {SSHKey} from '../../../shared/entity/ssh-key';

@Component({
  selector: 'km-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent {
  @Input() cluster: Cluster;
  @Input() clusterSSHKeys: SSHKey[] = [];

  constructor() {}

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
