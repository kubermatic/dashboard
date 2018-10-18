import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { gt } from 'semver';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ApiService, WizardService } from '../../core/services';
import { ClusterEntity, MasterVersion } from '../../shared/entity/ClusterEntity';
import { MachineNetworkForm } from '../../shared/model/ClusterForm';
import { MachineNetworksComponent } from '../../machine-networks/machine-networks.component';

@Component({
  selector: 'kubermatic-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss']
})
export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterSpecForm: FormGroup;
  public machineNetworkFormData: MachineNetworkForm[] = [];
  public masterVersions: MasterVersion[] = [];
  public defaultVersion: string;
  public checkMachineNetworksTooltip = '';
  private subscriptions: Subscription[] = [];

  constructor(private nameGenerator: ClusterNameGenerator,
              private api: ApiService,
              private wizardService: WizardService) { }

  ngOnInit() {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
      checkMachineNetworks: new FormControl({value: false, disabled: true}),
    });

    if (!!this.cluster.spec.machineNetworks && this.cluster.spec.machineNetworks.length > 0 && this.cluster.spec.machineNetworks[0].cidr !== '') {
      this.clusterSpecForm.controls.checkMachineNetworks.setValue(true);
    }

    this.subscriptions.push(this.clusterSpecForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.setClusterSpec();
    }));

    this.subscriptions.push(this.wizardService.machineNetworksFormChanges$.subscribe(res => {
      this.machineNetworkFormData = res;
      this.setClusterSpec();
    }));

    this.loadMasterVersions();
  }

  public ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }


  public generateName() {
    this.clusterSpecForm.patchValue({ name: this.nameGenerator.generateName() });
  }

  versionChanged() {
    const shouldEnable = this.enableMachineNetworkConfiguration(this.clusterSpecForm.controls.version.value);
    const checkMachineNetworks = this.clusterSpecForm.get('checkMachineNetworks');
    if (!!shouldEnable) {
      checkMachineNetworks.enable();
    } else {
      checkMachineNetworks.disable();
      this.checkMachineNetworksTooltip = 'Option "Configure Machine Networks" is only allowed if Master Version >= 1.9.0';
    }
  }

  enableMachineNetworkConfiguration(version: string): boolean {
    return (!!version && gt(version, '1.8.9'));
  }

  loadMasterVersions() {
    this.subscriptions.push(this.api.getMasterVersions().subscribe(versions => {
      this.masterVersions = versions;
      for (const i in versions) {
        if (versions[i].default) {
          this.defaultVersion = versions[i].version;
          this.clusterSpecForm.controls.version.setValue(versions[i].version);
          this.versionChanged();
        }
      }
    }));
  }


  setClusterSpec() {
    let isValid = false;
    if (!!this.clusterSpecForm.controls.checkMachineNetworks.value) {
      if (this.machineNetworkFormData.length > 0) {
        for (const i in this.machineNetworkFormData) {
          if (i === '0') {
            isValid = this.machineNetworkFormData[i].valid;
          } else {
            isValid = isValid && this.machineNetworkFormData[i].valid;
          }
        }
      } else {
        isValid = false;
      }
    } else {
      isValid = this.clusterSpecForm.valid;
    }

    this.wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      version: this.clusterSpecForm.controls.version.value,
      machineNetworks: this.machineNetworkFormData,
      valid: this.clusterSpecForm.valid && isValid,
    });
  }

}
