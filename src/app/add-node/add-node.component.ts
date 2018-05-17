import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { NodeData, NodeProviderData } from '../shared/model/NodeSpecChange';
import { OperatingSystemSpec, NodeCloudSpec } from '../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() initialNode: boolean;
  public nodeForm: FormGroup = new FormGroup({
    count: new FormControl(1, [Validators.required, Validators.min(1)]),
    operatingSystem: new FormControl('ubuntu', Validators.required),
    containerRuntime: new FormControl('docker'),
  });
  public operatingSystemForm: FormGroup = new FormGroup({
    distUpgradeOnBoot: new FormControl(false),
    disableAutoUpdate: new FormControl(false),
  });
  private formOnChangeSub: Subscription;
  private operatingSystemDataChangeSub: Subscription;
  private providerDataChangedSub: Subscription;
  private providerData: NodeProviderData = { valid: false };

  constructor(private addNodeService: AddNodeService) {
  }

  ngOnInit() {
    if (this.initialNode) {
      this.nodeForm.setValue({count: 3, operatingSystem: 'ubuntu', containerRuntime: 'docker'});
    }

    this.formOnChangeSub = this.nodeForm.valueChanges.subscribe(data => {
      this.operatingSystemForm.setValue({distUpgradeOnBoot: false, disableAutoUpdate: false});
      this.addNodeService.changeNodeData(this.getAddNodeData());
    });

    this.operatingSystemDataChangeSub = this.operatingSystemForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeData(this.getAddNodeData());
      this.addNodeService.changeNodeOperatingSystemData(this.getOSSpec());
    });

    this.providerDataChangedSub = this.addNodeService.nodeProviderDataChanges$.subscribe(data => {
      this.providerData = data;
      this.addNodeService.changeNodeData(this.getAddNodeData());
    });
  }

  ngOnDestroy(): void {
    this.formOnChangeSub.unsubscribe();
    this.operatingSystemDataChangeSub.unsubscribe();
    this.providerDataChangedSub.unsubscribe();
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
