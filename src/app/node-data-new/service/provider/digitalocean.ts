import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap, tap} from 'rxjs/operators';

import {ApiService, DatacenterService, PresetsService, ProjectService} from '../../../core/services';
import {DigitaloceanSizes} from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../shared/services/cluster.service';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataDigitalOceanProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _datacenterService: DatacenterService) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.digitalocean.tags;
    this._nodeDataService.nodeData.spec.cloud.digitalocean.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<DigitaloceanSizes> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.DIGITALOCEAN))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.DIGITALOCEAN)
                .token(cluster.spec.cloud.digitalocean.token)
                .credential(this._presetService.preset)
                .flavors(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
                  })
                )
            )
          );
      case NodeDataMode.Dialog:
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(tap(project => selectedProject = project.id))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc)))
          .pipe(switchMap(dc => this._apiService.getDigitaloceanSizes(
            selectedProject,
            dc.spec.seed,
            this._clusterService.cluster.id,
          )))
          .pipe(catchError(_ => {
            if (onError) {
              onError();
            }

            return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
          }));
    }
  }
}
