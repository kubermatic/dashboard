import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from '../../../core/services';
import { DigitaloceanOptions } from '../../../shared/entity/node/DigitaloceanNodeSpec';
import { CloudSpec } from '../../../shared/entity/ClusterEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-digitalocean-options',
  templateUrl: './digitalocean-options.component.html',
  styleUrls: ['./digitalocean-options.component.scss']
})

export class DigitaloceanOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  public doOptionsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService) { }

  ngOnInit(): void {
  this.doOptionsForm = new FormGroup({
      backups: new FormControl(this.nodeData.node.spec.cloud.digitalocean.backups),
      ipv6: new FormControl(this.nodeData.node.spec.cloud.digitalocean.ipv6),
      monitoring: new FormControl(this.nodeData.node.spec.cloud.digitalocean.monitoring),
      tags: new FormControl([]),
    });
    this.subscriptions.push(this.doOptionsForm.valueChanges.subscribe(data => {
      this.addNodeService.changeDoOptionsData(this.getDoOptionsData());
    }));

    this.addNodeService.changeDoOptionsData(this.getDoOptionsData());
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getDoOptionsData(): DigitaloceanOptions {
    let doTags: string[] = [];
    if ((this.doOptionsForm.controls.tags.value).length > 0) {
      doTags = (this.doOptionsForm.controls.tags.value).split(/[\s]?,[\s]?/);
    }

    return {
      backups: this.doOptionsForm.controls.backups.value,
      ipv6: this.doOptionsForm.controls.ipv6.value,
      monitoring: this.doOptionsForm.controls.monitoring.value,
      tags: this.doOptionsForm.controls.tags.value,
    };
  }
}
