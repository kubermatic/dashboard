import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ApiService, WizardService } from '../../core/services';
import { ClusterEntity, MasterVersion } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss']
})
export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterSpecForm: FormGroup;
  public masterVersions: MasterVersion[] = [];
  public defaultVersion: string;
  public machineNetwork: FormArray;
  private subscriptions: Subscription[] = [];

  constructor(private nameGenerator: ClusterNameGenerator, private api: ApiService, private wizardService: WizardService) { }

  ngOnInit() {
    const machineNetworks = new FormArray([]);
    for (const i in this.cluster.spec.machineNetworks) {
      if (this.cluster.spec.machineNetworks.hasOwnProperty(i)) {
        machineNetworks.push(new FormGroup({
          cidr: new FormControl(this.cluster.spec.machineNetworks[i].cidr, [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\/\d{1,2})$/)]),
          dnsServers: new FormControl(this.cluster.spec.machineNetworks[i].dnsServers, [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3})$/)]),
          gateway: new FormControl(this.cluster.spec.machineNetworks[i].gateway, [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3})$/)])
        }));
      }
    }

    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
      checkMachineNetworks: new FormControl(),
      machineNetworks: machineNetworks
    });

    this.subscriptions.push(this.clusterSpecForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
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

  loadMasterVersions() {
    this.subscriptions.push(this.api.getMasterVersions().subscribe(versions => {
      this.masterVersions = versions;
      for (const i in versions) {
        if (versions[i].default) {
          this.defaultVersion = versions[i].version;
          this.clusterSpecForm.controls.version.setValue(versions[i].version);
        }
      }
    }));
  }

  getMachineNetworkForm(form) {
    return form.get('machineNetworks').controls;
  }

  addMachineNetwork() {
    this.machineNetwork = <FormArray>this.clusterSpecForm.get('machineNetworks');
    this.machineNetwork.push(new FormGroup({
      cidr: new FormControl('', [Validators.required]),
      dnsServers: new FormControl('', [Validators.required]),
      gateway: new FormControl('', [Validators.required])
    }));
  }

  deleteMachineNetwork(index: number): void {
    const arrayControl = <FormArray>this.clusterSpecForm.get('machineNetworks');
    arrayControl.removeAt(index);
  }

  setClusterSpec() {
    const machineNetworkList = [];
    for (const i in this.clusterSpecForm.controls.machineNetworks.value) {
      if (
        this.clusterSpecForm.controls.machineNetworks.value.hasOwnProperty(i) &&
        this.clusterSpecForm.controls.machineNetworks.value[i].cidr !== '' &&
        this.clusterSpecForm.controls.machineNetworks.value[i].dnsServers !== '' &&
        this.clusterSpecForm.controls.machineNetworks.value[i].gateway !== ''
      ) {
        machineNetworkList.push({
          cidr: this.clusterSpecForm.controls.machineNetworks.value[i].cidr,
          dnsServers: this.clusterSpecForm.controls.machineNetworks.value[i].dnsServers.split(/\s*\,+\s*/),
          gateway: this.clusterSpecForm.controls.machineNetworks.value[i].gateway
        });
      }
    }

    this.wizardService.changeClusterSpec({
      name: this.clusterSpecForm.controls.name.value,
      version: this.clusterSpecForm.controls.version.value,
      machineNetworks: machineNetworkList,
      valid: this.clusterSpecForm.valid,
    });
  }

}
