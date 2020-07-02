import {EventEmitter, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {CloudSpec, Cluster, ClusterType} from '../../shared/entity/cluster';
import {SSHKey} from '../../shared/entity/ssh-key';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Injectable()
export class ClusterService {
  readonly providerChanges = new EventEmitter<NodeProvider>();
  readonly datacenterChanges = new EventEmitter<string>();
  readonly sshKeyChanges = new EventEmitter<SSHKey[]>();
  readonly clusterChanges = new EventEmitter<Cluster>();
  readonly admissionPluginsChanges = new EventEmitter<string[]>();
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();

  private _cluster: Cluster = Cluster.newEmptyClusterEntity();
  private _sshKeys: SSHKey[] = [];
  private _admissionPluginsEntity: string[] = [];

  set cluster(cluster: Cluster) {
    if (
      this._getProvider(this._cluster) !== NodeProvider.NONE &&
      this._getProvider(cluster) !== NodeProvider.NONE &&
      this._getProvider(this._cluster) !== this._getProvider(cluster)
    ) {
      return;
    }

    this._cluster = _.mergeWith(this._cluster, cluster, value => {
      if (_.isArray(value)) {
        return value;
      }
    });
    this.clusterChanges.emit(this._cluster);
  }

  get cluster(): Cluster {
    return this._cluster;
  }

  set provider(provider: NodeProvider) {
    this._cluster.spec.cloud = {} as CloudSpec;
    this.cluster = {
      spec: {
        cloud: {
          [provider]: {},
        } as any,
      },
    } as Cluster;

    if (provider) {
      this.providerChanges.emit(provider);
    }
  }

  get provider(): NodeProvider {
    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (this._cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
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
      this.datacenterChanges.emit(datacenter);
    }
  }

  get datacenter(): string {
    return this._cluster.spec.cloud.dc;
  }

  set labels(labels: object) {
    delete this._cluster.labels;
    this._cluster.labels = labels;
  }

  set sshKeys(keys: SSHKey[]) {
    this._sshKeys = keys;
    this.sshKeyChanges.emit(this._sshKeys);
  }

  get sshKeys(): SSHKey[] {
    return this._sshKeys;
  }

  set admissionPlugins(plugins: string[]) {
    this._admissionPluginsEntity = plugins;
    this.admissionPluginsChanges.emit(this._admissionPluginsEntity);
  }

  get admissionPlugins(): string[] {
    return this._admissionPluginsEntity;
  }

  set clusterType(type: ClusterType) {
    this._cluster.type = type;
    this.clusterTypeChanges.emit(type);
  }

  get clusterType(): ClusterType {
    return this._cluster.type;
  }

  reset(): void {
    this._cluster = Cluster.newEmptyClusterEntity();
  }

  private _getProvider(cluster: Cluster): NodeProvider {
    if (!cluster || !cluster.spec || !cluster.spec.cloud) {
      return NodeProvider.NONE;
    }

    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }
}
