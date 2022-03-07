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
import {LabelFormComponent} from '@shared/components/label-form/component';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {SSHKey} from '@shared/entity/ssh-key';
import {getIpCount} from '@shared/functions/get-ip-count';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import _ from 'lodash';

@Component({
  selector: 'km-cluster-summary',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterSummaryComponent {
  private _sshKeys: SSHKey[] = [];
  @Input() cluster: Cluster;
  @Input() machineDeployment: MachineDeployment;
  @Input() datacenter: Datacenter;
  @Input() seedSettings: SeedSettings;
  @Input() flipLayout = false;

  @Input()
  set sshKeys(keys: string[]) {
    this._sshKeys = keys?.map(key => ({name: key} as SSHKey));
  }

  get provider(): NodeProvider {
    const providers = Object.values(NodeProvider)
      .map(provider => (this.cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);
    return providers.length > 0 ? providers[0] : NodeProvider.NONE;
  }

  get admissionPlugins(): string[] {
    return Object.keys(AdmissionPlugin);
  }

  get hasAdmissionPlugins(): boolean {
    return !_.isEmpty(this.cluster.spec.admissionPlugins);
  }

  get operatingSystem(): string {
    return getOperatingSystem(this.machineDeployment.spec.template);
  }

  get operatingSystemLogoClass(): string {
    return getOperatingSystemLogoClass(this.machineDeployment.spec.template);
  }

  get isMLAEnabled(): boolean {
    return this.seedSettings?.mla?.user_cluster_mla_enabled;
  }

  get hasIPLeft(): boolean {
    const ipCount = getIpCount(this.cluster.spec.machineNetworks);
    return ipCount > 0 ? ipCount < this.machineDeployment.spec.replicas : false;
  }

  get hasNetworkConfiguration(): boolean {
    return !_.isEmpty(this.cluster.spec?.cniPlugin) || !_.isEmpty(this.cluster.spec?.clusterNetwork);
  }

  isAdmissionPluginEnabled(plugin: string): boolean {
    return this.cluster?.spec?.admissionPlugins?.includes(plugin) || false;
  }

  getAdmissionPluginName(plugin: string): string {
    return AdmissionPluginUtils.getPluginName(plugin);
  }

  getSSHKeys(): SSHKey[] {
    return this._sshKeys;
  }

  displaySettings(): boolean {
    return Object.values(NodeProvider).some(p => this._hasProviderOptions(p));
  }

  displayTags(tags: object): boolean {
    return !!tags && !_.isEmpty(Object.keys(LabelFormComponent.filterNullifiedKeys(tags)));
  }

  private _hasProviderOptions(provider: NodeProvider): boolean {
    return (
      this.provider === provider &&
      this.cluster.spec.cloud[provider] &&
      Object.values(this.cluster.spec.cloud[provider]).some(val => val)
    );
  }
}
