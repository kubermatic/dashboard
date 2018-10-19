import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { WizardService, DatacenterService, ProjectService } from '../core/services';
import { ClusterEntity } from '../shared/entity/ClusterEntity';
import { NodeData, NodeProviderData } from '../shared/model/NodeSpecChange';
import { OperatingSystemSpec} from '../shared/entity/NodeEntity';
import { NoIpsLeftValidator } from '../shared/validators/no-ips-left.validator';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() nodeData: NodeData;
  @Input() existingNodesCount: number;
  public projectId: string;
  public seedDCName: string;
  public nodeForm: FormGroup;
  public operatingSystemForm: FormGroup;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];
  private providerData: NodeProviderData = { valid: false };

  constructor(private addNodeService: AddNodeService,
              private wizardService: WizardService,
              private _dc: DatacenterService,
              private _project: ProjectService) {
  }

  ngOnInit() {
    this.nodeForm = new FormGroup({
      count: new FormControl(this.nodeData.count, [Validators.required, Validators.min(1), NoIpsLeftValidator(this.cluster, this.existingNodesCount)]),
      operatingSystem: new FormControl(Object.keys(this.nodeData.node.spec.operatingSystem)[0], Validators.required),
    });

    this.nodeForm.controls.count.markAsTouched();

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

    this.subscriptions.push(this._dc.getDataCenter(this.cluster.spec.cloud.dc).subscribe(dc => {
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
          }
        },
      },
      count: this.nodeForm.controls.count.value,
      valid: this.providerData.valid,
    };
  }

}
