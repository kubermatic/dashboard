import {EventEmitter, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {
  CloudSpec,
  ClusterEntity,
  ClusterType,
} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Injectable()
export class ClusterService {
  readonly providerChanges = new EventEmitter<NodeProvider>();
  readonly datacenterChanges = new EventEmitter<string>();
  readonly sshKeyChanges = new EventEmitter<SSHKeyEntity[]>();
  readonly clusterChanges = new EventEmitter<ClusterEntity>();
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();

  private _clusterEntity: ClusterEntity = ClusterEntity.newEmptyClusterEntity();
  private _sshKeysEntity: SSHKeyEntity[] = [];

  set cluster(cluster: ClusterEntity) {
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

  get cluster(): ClusterEntity {
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
    } as ClusterEntity;

    if (provider) {
      this.providerChanges.emit(provider);
    }
  }

  get provider(): NodeProvider {
    const clusterProviders = Object.values(NodeProvider)
      .map(provider =>
        this._clusterEntity.spec.cloud[provider] ? provider : undefined
      )
      .filter(p => p !== undefined);

    return clusterProviders.length > 0
      ? clusterProviders[0]
      : NodeProvider.NONE;
  }

  set datacenter(datacenter: string) {
    this.cluster = {
      spec: {
        cloud: {
          dc: datacenter,
        } as CloudSpec,
      },
    } as ClusterEntity;

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

  set sshKeys(keys: SSHKeyEntity[]) {
    this._sshKeysEntity = keys;
    this.sshKeyChanges.emit(this._sshKeysEntity);
  }

  get sshKeys(): SSHKeyEntity[] {
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
    this._clusterEntity = ClusterEntity.newEmptyClusterEntity();
  }

  private _getProvider(cluster: ClusterEntity): NodeProvider {
    if (!cluster || !cluster.spec || !cluster.spec.cloud) {
      return NodeProvider.NONE;
    }

    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0
      ? clusterProviders[0]
      : NodeProvider.NONE;
  }
}
