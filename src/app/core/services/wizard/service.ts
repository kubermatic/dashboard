import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import * as _ from 'lodash';
import {ReplaySubject} from 'rxjs';

import {CloudSpec, ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';
import {StepRegistry, WizardStep} from '../../../wizard-new/step/step';

@Injectable()
export class NewWizardService {
  readonly providerChanges = new ReplaySubject<NodeProvider>();
  readonly datacenterChanges = new ReplaySubject<string>();
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();
  readonly clusterChanges = new ReplaySubject<ClusterEntity>();

  private _clusterEntity: ClusterEntity = ClusterEntity.NewEmptyClusterEntity();
  private _stepper: MatStepper;
  private _clusterType: ClusterType;
  private _steps: WizardStep[];

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = _.merge(this._clusterEntity, cluster);
    this.clusterChanges.next(this._clusterEntity);
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
  }

  set provider(provider: NodeProvider) {
    // TODO: export to some handler
    if (provider === NodeProvider.BRINGYOUROWN) {
      this._hideStep(StepRegistry.Settings);
    } else {
      this._showStep(StepRegistry.Settings);
    }

    this._clusterEntity.spec.cloud = {} as CloudSpec;
    this._clusterEntity.spec.cloud[provider] = {};
    this.providerChanges.next(provider);
    this.clusterChanges.next(this._clusterEntity);
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

  set clusterType(type: ClusterType) {
    this._clusterType = type;
    this.clusterTypeChanges.emit(type);
  }

  get clusterType(): ClusterType {
    return this._clusterType;
  }

  get steps(): WizardStep[] {
    return this._steps;
  }

  set steps(steps: WizardStep[]) {
    this._steps = steps;
  }

  private _hideStep(step: StepRegistry): void {
    this.steps.forEach((item, idx) => {
      if (item.name === step) {
        this.steps[idx].enabled = false;
      }
    });
  }

  private _showStep(step: StepRegistry): void {
    this.steps.forEach((item, idx) => {
      if (item.name === step) {
        this.steps[idx].enabled = true;
      }
    });
  }
}
