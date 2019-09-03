import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {ReplaySubject} from 'rxjs';

import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';

@Injectable()
export class NewWizardService {
  readonly providerChanges = new EventEmitter<NodeProvider>();
  readonly datacenterChanges = new ReplaySubject<string>();
  // True - enabled, false - disabled
  readonly presetStatusChanges = new EventEmitter<boolean>();
  readonly presetChanges = new EventEmitter<string>();
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();

  private _clusterEntity: ClusterEntity = {
    spec: {
      cloud: {} as CloudSpec,
    } as ClusterSpec,
  } as ClusterEntity;
  private _stepper: MatStepper;
  private _preset: string;
  private _clusterType: ClusterType;

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = {...this._clusterEntity, ...cluster};
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
  }

  set provider(provider: NodeProvider) {
    this._clusterEntity.spec.cloud = {} as CloudSpec;
    this._clusterEntity.spec.cloud[provider] = {};
    this.providerChanges.emit(provider);
  }

  get provider(): NodeProvider {
    const clusterProviders = Object.values(NodeProvider)
                                 .map(provider => this._clusterEntity.spec.cloud[provider] ? provider : undefined)
                                 .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }

  set datacenter(datacenter: string) {
    this._clusterEntity.spec.cloud.dc = datacenter;
    this.datacenterChanges.next(datacenter);
  }

  get datacenter(): string {
    return this._clusterEntity.spec.cloud.dc;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  get stepper(): MatStepper {
    return this._stepper;
  }

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.emit(preset);
  }

  get preset(): string {
    return this._preset;
  }

  set clusterType(type: ClusterType) {
    this._clusterType = type;
    this.clusterTypeChanges.emit(type);
  }

  get clusterType(): ClusterType {
    return this._clusterType;
  }

  enablePresets(enable: boolean): void {
    this.presetStatusChanges.emit(enable);
  }
}
