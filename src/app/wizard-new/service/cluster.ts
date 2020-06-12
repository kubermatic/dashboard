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
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();

  private _clusterEntity: Cluster = Cluster.newEmptyClusterEntity();
  private _sshKeysEntity: SSHKey[] = [];

  set cluster(cluster: Cluster) {
    if (
      this._getProvider(this._clusterEntity) !== NodeProvider.NONE &&
      this._getProvider(cluster) !== NodeProvider.NONE &&
      this._getProvider(this._clusterEntity) !== this._getProvider(cluster)
    ) {
      return;
    }

    this._clusterEntity = _.mergeWith(this._clusterEntity, cluster, value => {
      if (_.isArray(value)) {
        return value;
      }
    });
    this.clusterChanges.emit(this._clusterEntity);
  }

  get cluster(): Cluster {
    return this._clusterEntity;
  }

  set provider(provider: NodeProvider) {
    this._clusterEntity.spec.cloud = {} as CloudSpec;
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
      .map(provider => (this._clusterEntity.spec.cloud[provider] ? provider : undefined))
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
    return this._clusterEntity.spec.cloud.dc;
  }

  set labels(labels: object) {
    delete this._clusterEntity.labels;
    this._clusterEntity.labels = labels;
  }

  set sshKeys(keys: SSHKey[]) {
    this._sshKeysEntity = keys;
    this.sshKeyChanges.emit(this._sshKeysEntity);
  }

  get sshKeys(): SSHKey[] {
    return this._sshKeysEntity;
  }

  set clusterType(type: ClusterType) {
    this._clusterEntity.type = type;
    this.clusterTypeChanges.emit(type);
  }

  get clusterType(): ClusterType {
    return this._clusterEntity.type;
  }

  reset(): void {
    this._clusterEntity = Cluster.newEmptyClusterEntity();
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
