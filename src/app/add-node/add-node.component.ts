import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { WizardService } from '../core/services/wizard/wizard.service';
import { NodeData, NodeProviderData } from '../shared/model/NodeSpecChange';
import { OperatingSystemSpec, NodeCloudSpec } from '../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  @Input() nodeData: NodeData;
  public nodeForm: FormGroup;
  public operatingSystemForm: FormGroup;

  public hideOptional = true;
  private subscriptions: Subscription[] = [];
  private providerData: NodeProviderData = { valid: false };

  constructor(private addNodeService: AddNodeService, private wizardService: WizardService) {
  }

  ngOnInit() {
    this.nodeForm = new FormGroup({
      count: new FormControl(this.nodeData.count, [Validators.required, Validators.min(1)]),
      operatingSystem: new FormControl(Object.keys(this.nodeData.node.spec.operatingSystem)[0], Validators.required),
      containerRuntime: new FormControl(this.nodeData.node.spec.versions.containerRuntime.name),
    });

    let distUpgradeOnBootUbuntu = false;
    let distUpgradeOnBootCentos = false;
    let disableAutoUpdate = false;
    if (!!this.nodeData.node.spec.operatingSystem.ubuntu) {
      distUpgradeOnBootUbuntu = this.nodeData.node.spec.operatingSystem.ubuntu.distUpgradeOnBoot;
    } else if (!!this.nodeData.node.spec.operatingSystem.centos) {
      distUpgradeOnBootCentos = this.nodeData.node.spec.operatingSystem.centos.distUpgradeOnBoot;
    } else if (!!this.nodeData.node.spec.operatingSystem.containerLinux) {
      disableAutoUpdate = this.nodeData.node.spec.operatingSystem.containerLinux.disableAutoUpdate;
    }

    this.operatingSystemForm = new FormGroup({
      distUpgradeOnBootUbuntu: new FormControl(distUpgradeOnBootUbuntu),
      distUpgradeOnBootCentos: new FormControl(distUpgradeOnBootCentos),
      disableAutoUpdate: new FormControl(disableAutoUpdate),
    });

    this.subscriptions.push(this.nodeForm.valueChanges.subscribe(data => {
      this.operatingSystemForm.setValue({distUpgradeOnBootUbuntu: false, distUpgradeOnBootCentos: false, disableAutoUpdate: false});
      this.addNodeService.changeNodeData(this.getAddNodeData());
    }));

    this.subscriptions.push(this.operatingSystemForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeData(this.getAddNodeData());
      this.addNodeService.changeNodeOperatingSystemData(this.getOSSpec());
    }));

    this.subscriptions.push(this.addNodeService.nodeProviderDataChanges$.subscribe(data => {
      this.providerData = data;
      this.addNodeService.changeNodeData(this.getAddNodeData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));
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
          }
        };
      case 'centos':
        return {
          centos: {
            distUpgradeOnBoot: this.operatingSystemForm.controls.distUpgradeOnBootCentos.value,
          }
        };
      case 'containerLinux':
        return {
          containerLinux: {
            disableAutoUpdate: this.operatingSystemForm.controls.disableAutoUpdate.value,
          }
        };
      default:
        return {
          ubuntu: {
            distUpgradeOnBoot: false,
          }
        };
    }
  }


  getAddNodeData(): NodeData {
    const osSpec = this.getOSSpec();
    return {
      node: {
        spec: {
          cloud: this.providerData.spec,
          operatingSystem: osSpec,
          versions: {
            containerRuntime: {
              name: this.nodeForm.controls.containerRuntime.value,
            }
          }
        },
      },
      count: this.nodeForm.controls.count.value,
      valid: this.providerData.valid,
    };
  }

}
