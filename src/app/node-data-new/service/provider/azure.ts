import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap, tap} from 'rxjs/operators';
import {DatacenterService, PresetsService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {AzureSizes} from '../../../shared/entity/provider/azure/AzureSizeEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataAzureProvider {
  constructor(
      private readonly _nodeDataService: NodeDataService, private readonly _clusterService: ClusterService,
      private readonly _presetService: PresetsService, private readonly _datacenterService: DatacenterService) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.azure.tags;
    this._nodeDataService.nodeData.spec.cloud.azure.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AzureSizes[]> {
    let cluster: ClusterEntity;
    let location = '';

    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
            .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
            .pipe(tap(c => cluster = c))
            .pipe(switchMap(_ => this._datacenterService.getDataCenter(cluster.spec.cloud.dc)))
            .pipe(tap(dc => location = dc.spec.azure.location))
            .pipe(switchMap(
                _ => this._presetService.provider(NodeProvider.AZURE)
                         .clientID(cluster.spec.cloud.azure.clientID)
                         .clientSecret(cluster.spec.cloud.azure.clientSecret)
                         .subscriptionID(cluster.spec.cloud.azure.subscriptionID)
                         .tenantID(cluster.spec.cloud.azure.tenantID)
                         .location(location)
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
}
