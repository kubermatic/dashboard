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

import {Component, Input, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService, DatacenterService} from '../../core/services';
import {Cluster} from '../../shared/entity/cluster';
import {Datacenter} from '../../shared/entity/datacenter';
import {SSHKey} from '../../shared/entity/ssh-key';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss'],
})
export class SetSettingsComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() clusterSSHKeys: SSHKey[] = [];
  @Input() nodeData: NodeData;
  isExtended = false;
  seedDc: Datacenter;
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService, private _dc: DatacenterService) {}

  ngOnInit(): void {
    this._dc
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this.seedDc = dc;
      });
  }

  extend(): void {
    this.isExtended = !this.isExtended;
    this.wizardService.changeSettingsFormView({hideOptional: !this.isExtended});
  }
}
