import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { NodeData, NodeProviderData } from '../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})
export class AddNodeComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public nodeForm: FormGroup = new FormGroup({
    count: new FormControl(1, [Validators.required, Validators.min(1)]),
  });
  private formOnChangeSub: Subscription;
  private providerDataChangedSub: Subscription;
  private providerData: NodeProviderData = { valid: false };

  constructor(private addNodeService: AddNodeService) {
  }

  ngOnInit() {
    this.formOnChangeSub = this.nodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeData(this.getAddNodeData());
    });

    this.providerDataChangedSub = this.addNodeService.nodeProviderDataChanges$.subscribe(data => {
      this.providerData = data;
      this.addNodeService.changeNodeData(this.getAddNodeData());
    });
  }

  ngOnDestroy(): void {
    this.formOnChangeSub.unsubscribe();
    this.providerDataChangedSub.unsubscribe();
  }

  getAddNodeData(): NodeData {
    return {
      node: {
        metadata: {},
        spec: {
          cloud: this.providerData.spec,
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            }
          }
        },
      },
      count: this.nodeForm.controls.count.value,
      valid: this.nodeForm.valid && this.providerData.valid,
    };
  }
}
