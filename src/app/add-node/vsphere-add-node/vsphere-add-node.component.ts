import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-vsphere-add-node',
  templateUrl: './vsphere-add-node.component.html',
  styleUrls: ['./vsphere-add-node.component.scss'],
})

export class VSphereAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  @Input() public nodeData: NodeData;
  public vsphereNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.vsphereNodeForm = new FormGroup({
      cpu: new FormControl(this.nodeData.node.spec.cloud.vsphere.cpus, [Validators.required, Validators.min(1), Validators.max(8)]),
      memory: new FormControl(this.nodeData.node.spec.cloud.vsphere.memory, [Validators.required, Validators.min(512)]),
    });

    this.subscriptions.push(this.vsphereNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        vsphere: {
          cpus: this.vsphereNodeForm.controls.cpu.value,
          memory: this.vsphereNodeForm.controls.memory.value,
          template: this.nodeData.node.spec.cloud.vsphere.template,
        },
      },
      valid: this.vsphereNodeForm.valid,
    };
  }
}
