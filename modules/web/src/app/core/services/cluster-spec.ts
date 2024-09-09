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

import {EventEmitter, Injectable} from '@angular/core';
import {CloudSpec, Cluster, ClusterAnnotation, EventRateLimitConfig} from '@shared/entity/cluster';
import {SSHKey} from '@shared/entity/ssh-key';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import _ from 'lodash';
import {ClusterTemplate, ClusterTemplateSSHKey} from '@shared/entity/cluster-template';

@Injectable()
export class ClusterSpecService {
  readonly providerChanges = new EventEmitter<NodeProvider>();
  readonly datacenterChanges = new EventEmitter<string>();
  readonly sshKeyChanges = new EventEmitter<SSHKey[]>();
  readonly clusterChanges = new EventEmitter<Cluster>();
  readonly providerSpecChanges = new EventEmitter<void>();

  private _cluster: Cluster = Cluster.newEmptyClusterEntity();
  private isCusterTemplateEditMode = false;

  get cluster(): Cluster {
    return this._cluster;
  }

  set cluster(cluster: Cluster) {
    if (
      this.getProvider(this._cluster) !== NodeProvider.NONE &&
      this.getProvider(cluster) !== NodeProvider.NONE &&
      this.getProvider(this._cluster) !== this.getProvider(cluster)
    ) {
      return;
    }

    this._cluster = _.mergeWith(this._cluster, cluster, (dest, src) =>
      _.isArray(dest) && _.isArray(src) ? dest : undefined
    );

    // Copy cluster network using different customizer, it will overwrite
    // destination array with source array instead of ignoring the changes.
    if (cluster && cluster.spec && cluster.spec.clusterNetwork) {
      this._cluster.spec.clusterNetwork = _.mergeWith(
        this._cluster.spec.clusterNetwork,
        cluster.spec.clusterNetwork,
        (dest, src) => (_.isArray(dest) && _.isArray(src) ? src : undefined)
      );
    }

    this.clusterChanges.emit(this._cluster);
  }

  private _sshKeys: SSHKey[] = [];

  get sshKeys(): SSHKey[] {
    return this._sshKeys;
  }

  set sshKeys(keys: SSHKey[]) {
    this._sshKeys = keys;
    this.sshKeyChanges.emit(this._sshKeys);
  }

  get clusterTemplateEditMode(): boolean {
    return this.isCusterTemplateEditMode;
  }

  get provider(): NodeProvider {
    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (this._cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }

  set provider(provider: NodeProvider) {
    this._cluster.spec.cloud = {} as CloudSpec;
    this.cluster = {
      spec: {
        cloud: {} as CloudSpec,
      },
    } as Cluster;
    this.cluster.spec.cloud[provider] = {};

    if (provider) {
      this.providerChanges.next(provider);
    }
  }

  get datacenter(): string {
    return this._cluster.spec.cloud.dc;
  }

  set datacenter(datacenter: string) {
    this.cluster = {
      spec: {
        cloud: {
          dc: datacenter,
        } as CloudSpec,
      },
    } as Cluster;

    if (datacenter) {
      this.datacenterChanges.next(datacenter);
    }
  }

  set labels(labels: Record<string, string>) {
    delete this._cluster.labels;
    this._cluster.labels = labels;
  }

  set annotations(annotations: Record<string, string>) {
    this._cluster.annotations = annotations;
  }

  set podNodeSelectorAdmissionPluginConfig(config: Record<string, string>) {
    this._cluster.spec.podNodeSelectorAdmissionPluginConfig = config;
  }

  set admissionPlugins(plugins: string[]) {
    this._cluster.spec.admissionPlugins = plugins;
    this.clusterChanges.emit(this._cluster);
  }

  get eventRateLimitConfig(): EventRateLimitConfig {
    return this._cluster.spec.eventRateLimitConfig;
  }

  set eventRateLimitConfig(config: EventRateLimitConfig) {
    this._cluster.spec.eventRateLimitConfig = config;
    this.clusterChanges.emit(this._cluster);
  }

  reset(): void {
    this._cluster = Cluster.newEmptyClusterEntity();
    this._sshKeys = [];
    this.isCusterTemplateEditMode = false;
  }

  initializeClusterFromClusterTemplate(template: ClusterTemplate): void {
    this.cluster = template.cluster;
    this.sshKeys = this.sshKeysFromClusterTemplateUserSSHKeys(template.userSshKeys);
    if (template.annotations?.[ClusterAnnotation.InitialCNIValuesRequest]) {
      this.cluster.annotations = {
        ...(this.cluster.annotations || {}),
        [ClusterAnnotation.InitialCNIValuesRequest]: template.annotations[ClusterAnnotation.InitialCNIValuesRequest],
      };
    }
    this.isCusterTemplateEditMode = true;
  }

  emitChangeEvents(): void {
    this.sshKeyChanges.emit(this._sshKeys);
    this.datacenterChanges.next(this._cluster.spec.cloud.dc);
    this.providerChanges.emit(this.getProvider(this._cluster));
  }

  private sshKeysFromClusterTemplateUserSSHKeys(sshKeys: ClusterTemplateSSHKey[]): SSHKey[] {
    return sshKeys
      ? sshKeys.map(key => {
          return {name: key.name, id: key.id} as SSHKey;
        })
      : [];
  }

  getProvider(cluster: Cluster): NodeProvider {
    if (!cluster || !cluster.spec || !cluster.spec.cloud) {
      return NodeProvider.NONE;
    }

    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }
}
