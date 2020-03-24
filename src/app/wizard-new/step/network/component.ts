import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator} from '@angular/forms';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterService} from '../../service/cluster';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  MachineNetwork = 'machineNetwork',
}

@Component({
  selector: 'kubermatic-wizard-machine-network-step',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MachineNetworkStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => MachineNetworkStepComponent), multi: true}
  ]
})
export class MachineNetworkStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator,
                                                                     OnDestroy {
  cluster: ClusterEntity;

  readonly controls = Controls;

  constructor(
      wizard: WizardService, private readonly _clusterService: ClusterService, private readonly _builder: FormBuilder) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MachineNetwork]: this._builder.control(''),
    });

    this.cluster = this._clusterService.cluster;

    // if (!!this.cluster.spec.machineNetworks && this.cluster.spec.machineNetworks.length > 0) {
    //   this.setMachineNetworkForm.controls.checkMachineNetworks.setValue(true);
    // }
    //
    // if (!this.nodeData.spec.operatingSystem.containerLinux) {
    //   this.setMachineNetworkForm.controls.checkMachineNetworks.disable();
    // }
    //
    // this.setMachineNetworkForm.valueChanges.pipe(debounceTime(1000))
    //     .pipe(takeUntil(this._unsubscribe))
    //     .subscribe(() => {
    //       this.setMachineNetworks();
    //     });

    // this.wizardService.machineNetworksFormChanges$.pipe(takeUntil(this._unsubscribe))
    //     .subscribe((res: MachineNetworkForm[]) => {
    //       this.machineNetworkFormData = res;
    //       this.setMachineNetworks();
    //     });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  // setMachineNetworks(): void {
  //   let isValid = false;
  //   if (!!this.form.controls.checkMachineNetworks.value) {
  //     if (this.machineNetworkFormData.length > 0) {
  //       for (const i in this.machineNetworkFormData) {
  //         if (i === '0') {
  //           isValid = this.machineNetworkFormData[i].valid;
  //         } else {
  //           isValid = isValid && this.machineNetworkFormData[i].valid;
  //         }
  //       }
  //     } else {
  //       isValid = false;
  //     }
  //   }

  // this._wizardService.changeSetMachineNetworks({
  //   setMachineNetworks: this.setMachineNetworkForm.controls.checkMachineNetworks.value,
  //   machineNetworks: this.machineNetworkFormData,
  //   valid: isValid,
  // });
  // }
}
