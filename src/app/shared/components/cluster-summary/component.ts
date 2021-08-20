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
import {Cluster} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {SSHKey} from '@shared/entity/ssh-key';
import {getIpCount} from '@shared/functions/get-ip-count';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import * as _ from 'lodash';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {LabelFormComponent} from '@shared/components/label-form/component';
import {AdmissionPluginUtils} from '@shared/utils/admission-plugin-utils/admission-plugin-utils';

@Component({
  selector: 'km-cluster-summary',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterSummaryComponent {
  @Input() cluster: Cluster;
  @Input() machineDeployment: MachineDeployment;
  @Input() datacenter: Datacenter;
  @Input() seedSettings: SeedSettings;
  @Input() sshKeys: SSHKey[] = [];

  clusterAdmissionPlugins: string[] = [];

  get provider(): NodeProvider {
    const providers = Object.values(NodeProvider)
      .map(provider => (this.cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);
    return providers.length > 0 ? providers[0] : NodeProvider.NONE;
  }

  hasIPLeft(): boolean {
    const ipCount = getIpCount(this.cluster.spec.machineNetworks);
    return ipCount > 0 ? ipCount < this.machineDeployment.spec.replicas : false;
  }

  getOperatingSystem(): string {
    return getOperatingSystem(this.machineDeployment.spec.template);
  }

  getOperatingSystemLogoClass(): string {
    return getOperatingSystemLogoClass(this.machineDeployment.spec.template);
  }

  displaySettings(): boolean {
    return Object.values(NodeProvider).some(p => this._hasProviderOptions(p));
  }

  displayTags(tags: object): boolean {
    return !!tags && !_.isEmpty(Object.keys(LabelFormComponent.filterNullifiedKeys(tags)));
  }

  displayNoProviderTags(): boolean {
    const provider = this.provider;
    switch (provider) {
      case NodeProvider.AWS:
      case NodeProvider.OPENSTACK:
      case NodeProvider.AZURE:
        return !this.displayTags(this.machineDeployment.spec.template.cloud[provider].tags);
      case NodeProvider.ALIBABA:
        return !this.displayTags(this.machineDeployment.spec.template.cloud[provider].labels);
      case NodeProvider.DIGITALOCEAN:
      case NodeProvider.GCP:
      case NodeProvider.PACKET:
        return (
          this.machineDeployment.spec.template.cloud[provider] &&
          this.machineDeployment.spec.template.cloud[provider].tags &&
          _.isEmpty(this.machineDeployment.spec.template.cloud[provider].tags)
        );
    }

    return false;
  }

  getSSHKeyNames(): string {
    return this.sshKeys.map(key => key.name).join(', ');
  }

  hasAdmissionPlugins(): boolean {
    return !_.isEmpty(this.clusterAdmissionPlugins);
  }

  getAdmissionPlugins(): string {
    return AdmissionPluginUtils.getJoinedPluginNames(this.clusterAdmissionPlugins);
  }

  isMLAEnabled(): boolean {
    return !!this.seedSettings && !!this.seedSettings.mla && !!this.seedSettings.mla.user_cluster_mla_enabled;
  }

  private _hasProviderOptions(provider: NodeProvider): boolean {
    return (
      this.provider === provider &&
      this.cluster.spec.cloud[provider] &&
      Object.values(this.cluster.spec.cloud[provider]).some(val => val)
    );
  }
}
