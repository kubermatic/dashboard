import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap} from 'rxjs/operators';

import {PresetsService} from '../../../core/services';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataDigitalOceanProvider {
  constructor(
      private readonly _nodeDataService: NodeDataService, private readonly _clusterService: ClusterService,
      private readonly _presetService: PresetsService) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.digitalocean.tags;
    this._nodeDataService.nodeData.spec.cloud.digitalocean.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<DigitaloceanSizes> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
            .pipe(filter(_ => this._clusterService.provider === NodeProvider.DIGITALOCEAN))
            .pipe(switchMap(
                cluster => this._presetService.provider(NodeProvider.DIGITALOCEAN)
                               .token(cluster.spec.cloud.digitalocean.token)
                               .credential(this._presetService.preset)
                               .flavors(onLoadingCb)
                               .pipe(catchError(_ => {
                                 if (onError) {
                                   onError();
                                 }

                                 return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
                               }))));
    }
  }
}
