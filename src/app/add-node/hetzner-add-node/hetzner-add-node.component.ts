import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-hetzner-add-node',
  templateUrl: './hetzner-add-node.component.html',
  styleUrls: ['./hetzner-add-node.component.scss']
})

export class HetznerAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  public types: string[] = NodeInstanceFlavors.Hetzner;
  public hetznerNodeForm: FormGroup = new FormGroup({
    type: new FormControl(NodeInstanceFlavors.Hetzner[0], Validators.required),
  });
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.hetznerNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        hetzner: {
          type: this.hetznerNodeForm.controls.type.value,
        },
      },
      valid: this.hetznerNodeForm.valid,
    };
  }
}
