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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-openstack-node-options',
  templateUrl: './openstack-node-options.component.html',
  styleUrls: ['./openstack-node-options.component.scss'],
})
export class OpenstackNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _nodeDataService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        openstack: {
          flavor: this.nodeData.spec.cloud.openstack.flavor,
          image: this.nodeData.spec.cloud.openstack.image,
          useFloatingIP: this.nodeData.spec.cloud.openstack.useFloatingIP,
          diskSize: this.nodeData.spec.cloud.openstack.diskSize,
          tags: this.nodeData.spec.cloud.openstack.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
