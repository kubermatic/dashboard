
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

import {DatacenterService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {ClusterEntity} from '../shared/entity/ClusterEntity';
import {OperatingSystemSpec} from '../shared/entity/NodeEntity';
import {NodeData, NodeProviderData} from '../shared/model/NodeSpecChange';
import {NoIpsLeftValidator} from '../shared/validators/no-ips-left.validator';

@Component({
  selector: 'kubermatic-node-data',
  templateUrl: './node-data.component.html',
  styleUrls: ['./node-data.component.scss'],
})
export class NodeDataComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() nodeData: NodeData;
  @Input() existingNodesCount: number;
  @Input() isInWizard = false;
  isNameDisabled: boolean;
  projectId: string;
  seedDCName: string;
  nodeForm: FormGroup;
  operatingSystemForm: FormGroup;
  hideOptional = true;
  private subscriptions: Subscription[] = [];
  private providerData: NodeProviderData = {valid: false};

  constructor(
      private nameGenerator: ClusterNameGenerator, private addNodeService: NodeDataService,
      private wizardService: WizardService, private _dc: DatacenterService, private _project: ProjectService) {}

  ngOnInit(): void {
    this.isNameDisabled = this.nodeData.name && this.nodeData.name.length > 0 && !this.isInWizard;

    this.nodeForm = new FormGroup({
      count: new FormControl(
          this.nodeData.count,
          [Validators.required, Validators.min(1), NoIpsLeftValidator(this.cluster, this.existingNodesCount)]),
      operatingSystem: new FormControl(Object.keys(this.nodeData.spec.operatingSystem)[0], Validators.required),
      name: new FormControl({value: this.nodeData.name, disabled: this.isNameDisabled}),
    });

    this.nodeForm.controls.count.markAsTouched();

    let distUpgradeOnBootUbuntu = false;
    let distUpgradeOnBootCentos = false;
    let disableAutoUpdate = false;

    if (!!this.nodeData.spec.operatingSystem.ubuntu) {
      distUpgradeOnBootUbuntu = this.nodeData.spec.operatingSystem.ubuntu.distUpgradeOnBoot;
    } else if (!!this.nodeData.spec.operatingSystem.centos) {
      distUpgradeOnBootCentos = this.nodeData.spec.operatingSystem.centos.distUpgradeOnBoot;
    } else if (!!this.nodeData.spec.operatingSystem.containerLinux) {
      disableAutoUpdate = this.nodeData.spec.operatingSystem.containerLinux.disableAutoUpdate;
    }

    this.operatingSystemForm = new FormGroup({
      distUpgradeOnBootUbuntu: new FormControl(distUpgradeOnBootUbuntu),
      distUpgradeOnBootCentos: new FormControl(distUpgradeOnBootCentos),
      disableAutoUpdate: new FormControl(disableAutoUpdate),
    });

    this.subscriptions.push(this.nodeForm.valueChanges.subscribe(() => {
      this.operatingSystemForm.setValue(
          {distUpgradeOnBootUbuntu: false, distUpgradeOnBootCentos: false, disableAutoUpdate: false});
      this.addNodeService.changeNodeData(this.getAddNodeData());
    }));

    this.subscriptions.push(this.operatingSystemForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeData(this.getAddNodeData());
      this.addNodeService.changeNodeOperatingSystemData(this.getOSSpec());
    }));

    this.subscriptions.push(this.addNodeService.nodeProviderDataChanges$.subscribe((data) => {
      this.providerData = data;
      this.addNodeService.changeNodeData(this.getAddNodeData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));

    this.subscriptions.push(this._dc.getDataCenter(this.cluster.spec.cloud.dc).subscribe((dc) => {
      this.seedDCName = dc.spec.seed;
    }));

    this.projectId = this._project.project.id;
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getOSSpec(): OperatingSystemSpec {
    switch (this.nodeForm.controls.operatingSystem.value) {
      case 'ubuntu':
        return {
          ubuntu: {
            distUpgradeOnBoot: this.operatingSystemForm.controls.distUpgradeOnBootUbuntu.value,
          },
        };
      case 'centos':
        return {
          centos: {
            distUpgradeOnBoot: this.operatingSystemForm.controls.distUpgradeOnBootCentos.value,
          },
        };
      case 'containerLinux':
        return {
          containerLinux: {
            disableAutoUpdate: this.operatingSystemForm.controls.disableAutoUpdate.value,
          },
        };
      default:
        return {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
        };
    }
  }

  generateName(): void {
    this.nodeForm.patchValue({name: this.nameGenerator.generateName()});
  }

  getAddNodeData(): NodeData {
    return {
      spec: {
        cloud: this.providerData.spec,
        operatingSystem: this.getOSSpec(),
        versions: {},
      },
      name: this.nodeForm.controls.name.value,
      count: this.nodeForm.controls.count.value,
      valid: this.providerData.valid,
    };
  }
}
