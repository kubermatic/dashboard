import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { NodeData, NodeProviderData } from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-digitalocean-options',
  templateUrl: './digitalocean-options.component.html',
  styleUrls: ['./digitalocean-options.component.scss'],
})

export class DigitaloceanOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  public doOptionsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.doOptionsForm = new FormGroup({
      backups: new FormControl(this.nodeData.node.spec.cloud.digitalocean.backups),
      ipv6: new FormControl(this.nodeData.node.spec.cloud.digitalocean.ipv6),
      monitoring: new FormControl(this.nodeData.node.spec.cloud.digitalocean.monitoring),
      tags: new FormControl(this.nodeData.node.spec.cloud.digitalocean.tags.toString().replace(/\,/g, ', ')),
    });
    this.subscriptions.push(this.doOptionsForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getDoOptionsData());
    }));

    this.addNodeService.changeNodeProviderData(this.getDoOptionsData());
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getDoOptionsData(): NodeProviderData {
    let doTags: string[] = [];
    if ((this.doOptionsForm.controls.tags.value).length > 0) {
      doTags = (this.doOptionsForm.controls.tags.value).split(/[\s]?,[\s]?/);
    }

    return {
      spec: {
        digitalocean: {
          size: this.nodeData.node.spec.cloud.digitalocean.size,
          backups: this.doOptionsForm.controls.backups.value,
          ipv6: this.doOptionsForm.controls.ipv6.value,
          monitoring: this.doOptionsForm.controls.monitoring.value,
          tags: doTags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
