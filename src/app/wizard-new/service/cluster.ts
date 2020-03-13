import {EventEmitter, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {Observable} from 'rxjs';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Injectable()
export class ClusterService {
  readonly providerChanges = new EventEmitter<NodeProvider>();
  readonly datacenterChanges = new EventEmitter<string>();
  readonly sshKeyChanges = new EventEmitter<SSHKeyEntity[]>();

  private readonly _clusterChanges = new EventEmitter<ClusterEntity>();
  private _clusterEntity: ClusterEntity = ClusterEntity.NewEmptyClusterEntity();
  private _sshKeysEntity: SSHKeyEntity[] = [];

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = _.merge(this._clusterEntity, cluster);
    this._clusterChanges.emit(this._clusterEntity);
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
  }

  get clusterChanges(): Observable<ClusterEntity> {
    return this._clusterChanges;
  }

  set provider(provider: NodeProvider) {
    delete this._clusterEntity.spec.cloud;
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
                                 .map(provider => this._clusterEntity.spec.cloud[provider] ? provider : undefined)
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

  reset(): void {
    this._clusterEntity = ClusterEntity.NewEmptyClusterEntity();
  }
}
