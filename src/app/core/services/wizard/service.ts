import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';

import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';

@Injectable()
export class NewWizardService {
  providerChanges$ = new EventEmitter<NodeProvider>();

  private _clusterEntity: ClusterEntity = {
    spec: {
      cloud: {} as CloudSpec,
    } as ClusterSpec,
  } as ClusterEntity;
  private _stepper: MatStepper;

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = {...this._clusterEntity, ...cluster};
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
  }

  set provider(provider: NodeProvider) {
    this._clusterEntity.spec.cloud = {} as CloudSpec;
    this._clusterEntity.spec.cloud[provider] = {};
    this.providerChanges$.emit(provider);
  }

  get provider(): NodeProvider {
    const clusterProviders = Object.values(NodeProvider)
                                 .map(provider => this._clusterEntity.spec.cloud[provider] ? provider : undefined)
                                 .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  get stepper(): MatStepper {
    return this._stepper;
  }
}
