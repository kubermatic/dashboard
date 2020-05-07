import {merge, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap} from 'rxjs/operators';

import {DatacenterService, PresetsService} from '../../../core/services';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {OpenstackFlavor} from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataOpenstackProvider {
  constructor(
      private readonly _nodeDataService: NodeDataService, private readonly _clusterService: ClusterService,
      private readonly _presetService: PresetsService, private readonly _datacenterService: DatacenterService) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.openstack.tags;
    this._nodeDataService.nodeData.spec.cloud.openstack.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<OpenstackFlavor[]> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterService.clusterChanges, this._nodeDataService.nodeDataChanges)
            .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
            .pipe(switchMap(
                _ => this._presetService.provider(NodeProvider.OPENSTACK)
                         .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
                         .username(this._clusterService.cluster.spec.cloud.openstack.username)
                         .password(this._clusterService.cluster.spec.cloud.openstack.password)
                         .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
                         .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
                         .datacenter(this._clusterService.cluster.spec.cloud.dc)
                         .credential(this._presetService.preset)
                         .flavors(onLoadingCb)
                         .pipe(catchError(_ => {
                           if (onError) {
                             onError();
                           }

                           return onErrorResumeNext(of([]));
                         }))));
    }
  }

  dc(): Observable<DataCenterEntity> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._nodeDataService.operatingSystemChanges, this._clusterService.datacenterChanges)
            .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
            .pipe(switchMap(_ => this._datacenterService.getDataCenter(this._clusterService.cluster.spec.cloud.dc)));
    }
  }
}
