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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {NodeDataService} from '@app/node-data/service/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {LabelFormComponent} from '@shared/components/label-form/label-form.component';
import {Cluster} from '@shared/entity/cluster';
import {getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {SSHKey} from '@shared/entity/ssh-key';
import {getIpCount} from '@shared/functions/get-ip-count';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {ClusterService} from '@shared/services/cluster.service';
import {AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take, switchMap, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-wizard-summary-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SummaryStepComponent implements OnInit, OnDestroy {
  clusterSSHKeys: SSHKey[] = [];
  clusterAdmissionPlugins: string[] = [];
  nodeData: NodeData;
  cluster: Cluster;
  noMoreIpsLeft = false;

  private _location: string;
  private _country: string;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _datacenterService: DatacenterService
  ) {}

  get country(): string {
    return this._country;
  }

  get location(): string {
    return this._location;
  }

  get datacenter(): string {
    return this.cluster.spec.cloud.dc;
  }

  get provider(): NodeProvider {
    return this._clusterService.provider;
  }

  ngOnInit(): void {
    this.nodeData = this._nodeDataService.nodeData;
    this.cluster = this._clusterService.cluster;
    this._clusterService.sshKeyChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(keys => (this.clusterSSHKeys = keys));

    this._clusterService.admissionPluginsChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.clusterAdmissionPlugins = plugins));

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this._location = dc.spec.location;
        this._country = dc.spec.country;
      });

    if (this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this._noIpsLeft(this.cluster, this.nodeData.count);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getOperatingSystem(): string {
    return getOperatingSystem(this.nodeData.spec);
  }

  getOperatingSystemLogoClass(): string {
    return getOperatingSystemLogoClass(this.nodeData.spec);
  }

  getClusterType(): string {
    return Cluster.getDisplayType(this.cluster);
  }

  displaySettings(): boolean {
    return Object.values(NodeProvider).some(p => this._hasProviderOptions(p));
  }

  displayTags(tags: object): boolean {
    return !!tags && !_.isEmpty(Object.keys(LabelFormComponent.filterNullifiedKeys(tags)));
  }

  displayNoProviderTags(): boolean {
    const provider = this._clusterService.provider;
    switch (provider) {
      case NodeProvider.AWS:
      case NodeProvider.OPENSTACK:
      case NodeProvider.AZURE:
        return !this.displayTags(this.nodeData.spec.cloud[provider].tags);
      case NodeProvider.ALIBABA:
        return !this.displayTags(this.nodeData.spec.cloud[provider].labels);
      case NodeProvider.DIGITALOCEAN:
      case NodeProvider.GCP:
      case NodeProvider.PACKET:
        return (
          this.nodeData.spec.cloud[provider] &&
          this.nodeData.spec.cloud[provider].tags &&
          _.isEmpty(this.nodeData.spec.cloud[provider].tags)
        );
    }

    return false;
  }

  getDnsServers(dnsServers: string[]): string {
    return dnsServers.join(', ');
  }

  getSSHKeyNames(): string {
    return this.clusterSSHKeys.map(key => key.name).join(', ');
  }

  hasAdmissionPlugins(): boolean {
    return !_.isEmpty(this.clusterAdmissionPlugins);
  }

  getAdmissionPlugins(): string {
    return AdmissionPluginUtils.getJoinedPluginNames(this.clusterAdmissionPlugins);
  }

  private _hasProviderOptions(provider: NodeProvider): boolean {
    return (
      this._clusterService.provider === provider &&
      this.cluster.spec.cloud[provider] &&
      Object.values(this.cluster.spec.cloud[provider]).some(val => val)
    );
  }

  private _noIpsLeft(cluster: Cluster, nodeCount: number): boolean {
    const ipCount = getIpCount(cluster.spec.machineNetworks);
    return ipCount > 0 ? ipCount < nodeCount : false;
  }
}
