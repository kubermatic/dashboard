import {Injectable} from '@angular/core';
import * as _ from 'lodash';
import {ReplaySubject} from 'rxjs';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Injectable()
export class ClusterService {
  readonly clusterChanges = new ReplaySubject<ClusterEntity>();

  private _clusterEntity: ClusterEntity = ClusterEntity.NewEmptyClusterEntity();

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = _.merge(this._clusterEntity, cluster);
    this.clusterChanges.next(this._clusterEntity);
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
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
  }

  get datacenter(): string {
    return this._clusterEntity.spec.cloud.dc;
  }
}
