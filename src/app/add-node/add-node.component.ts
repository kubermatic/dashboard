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
      operatingSystem: new FormControl('ubuntu', Validators.required),
      containerRuntime: new FormControl('docker'),
    });

    this.operatingSystemForm = new FormGroup({
      distUpgradeOnBoot: new FormControl(false),
      disableAutoUpdate: new FormControl(false),
    });

    this.subscriptions.push(this.nodeForm.valueChanges.subscribe(data => {
      this.operatingSystemForm.setValue({distUpgradeOnBoot: false, disableAutoUpdate: false});
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
            distUpgradeOnBoot: this.operatingSystemForm.controls.distUpgradeOnBoot.value,
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
        metadata: {},
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
      valid: this.nodeForm.valid && this.providerData.valid,
    };
  }

}
