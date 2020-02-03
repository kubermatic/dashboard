import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {ReplaySubject} from 'rxjs';

import {CloudSpec, ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';
import {StepRegistry, WizardStep} from '../../../wizard-new/step/step';

@Injectable()
export class NewWizardService {
  readonly providerChanges = new ReplaySubject<NodeProvider>();
  readonly datacenterChanges = new ReplaySubject<string>();
  // True - enabled, false - disabled
  readonly presetStatusChanges = new EventEmitter<boolean>();
  readonly presetChanges = new EventEmitter<string>();
  readonly clusterTypeChanges = new EventEmitter<ClusterType>();
  readonly stepConfigChanges = new ReplaySubject<WizardStep>();

  private _clusterEntity: ClusterEntity = ClusterEntity.NewEmptyClusterEntity();
  private _stepper: MatStepper;
  private _preset: string;
  private _clusterType: ClusterType;
  private _steps: WizardStep[];

  set cluster(cluster: ClusterEntity) {
    this._clusterEntity = {...this._clusterEntity, ...cluster};
  }

  get cluster(): ClusterEntity {
    return this._clusterEntity;
  }

  set provider(provider: NodeProvider) {
    if (provider === NodeProvider.BRINGYOUROWN) {
      this.hideStep(StepRegistry.Settings);
    } else {
      this.showStep(StepRegistry.Settings);
    }

    this._clusterEntity.spec.cloud = {} as CloudSpec;
    this._clusterEntity.spec.cloud[provider] = {};
    this.providerChanges.next(provider);
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

  get steps(): WizardStep[] {
    return this._steps;
  }

  set steps(steps: WizardStep[]) {
    this._steps = steps;
  }

  enablePresets(enable: boolean): void {
    this.presetStatusChanges.emit(enable);
  }

  hideStep(step: StepRegistry): void {
    this.steps.forEach((item, idx) => {
      if (item.name === step) {
        this.steps[idx].required = false;
      }
    });
  }

  showStep(step: StepRegistry): void {
    this.steps.forEach((item, idx) => {
      if (item.name === step) {
        this.steps[idx].required = true;
        this.stepConfigChanges.next(this.steps[idx]);
      }
    });
  }
}
