import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ApiService, WizardService } from '../../core/services';
import { ClusterEntity, MasterVersion, MachineNetwork } from '../../shared/entity/ClusterEntity';
import { MachineNetworksComponent } from './machine-networks/machine-networks.component';

@Component({
  selector: 'kubermatic-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss']
})
export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterSpecForm: FormGroup;
  public machineNetworkData: MachineNetwork[] = [];
  public masterVersions: MasterVersion[] = [];
  public defaultVersion: string;
  public inhalt = [];
  private subscriptions: Subscription[] = [];
  @ViewChild('machineNetworksComponent', { read: ViewContainerRef }) container: ViewContainerRef;

  constructor(private nameGenerator: ClusterNameGenerator,
              private api: ApiService,
              private wizardService: WizardService,
              private _cfr: ComponentFactoryResolver) { }

  ngOnInit() {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
      checkMachineNetworks: new FormControl(),
    });

    this.subscriptions.push(this.clusterSpecForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.setClusterSpec();
    }));

    this.subscriptions.push(this.wizardService.machineNetworksFormChanges$.subscribe(res => {
      this.machineNetworkData = res;
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

  setClusterSpec() {
    let isValid = false;

    if (!!this.clusterSpecForm.controls.checkMachineNetworks.value) {
      if (this.machineNetworkData.length > 0) {
        for (const i in this.machineNetworkData) {
          if (this.machineNetworkData[i].cidr !== '' && this.machineNetworkData[i].dnsServers.length > 0 && this.machineNetworkData[i].gateway !== '') {
            isValid = true;
          } else {
            isValid = false;
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
      machineNetworks: this.machineNetworkData,
      valid: isValid,
    });
  }

}
