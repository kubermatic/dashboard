import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from '../../core/services';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import { DigitaloceanSizes } from '../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-digitalocean-add-node',
  templateUrl: './digitalocean-add-node.component.html',
  styleUrls: ['./digitalocean-add-node.component.scss']
})

export class DigitaloceanAddNodeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  public sizes: DigitaloceanSizes = { optimized: [], standard: [] };
  public loadingSizes = false;
  public doNodeForm: FormGroup;
  /*public doNodeForm: FormGroup = new FormGroup({
    size: new FormControl(0, Validators.required),
    backups: new FormControl(false),
    ipv6: new FormControl(false),
    monitoring: new FormControl(false),
    tags: new FormControl([]),
  });*/
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.doNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.node.spec.cloud.digitalocean.size, Validators.required),
      backups: new FormControl(this.nodeData.node.spec.cloud.digitalocean.backups),
      ipv6: new FormControl(this.nodeData.node.spec.cloud.digitalocean.ipv6),
      monitoring: new FormControl(this.nodeData.node.spec.cloud.digitalocean.monitoring),
      tags: new FormControl([this.nodeData.node.spec.cloud.digitalocean.tags]),
    });

    this.subscriptions.push(this.doNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.reloadDigitaloceanSizes();
    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  reloadDigitaloceanSizes() {
    if (this.cloudSpec.digitalocean.token) {
      this.subscriptions.push(this.api.getDigitaloceanSizes(this.cloudSpec.digitalocean.token).subscribe(data => {
        this.sizes = data;
        this.doNodeForm.controls.size.setValue(this.sizes.standard[0].slug);
      }));
    }
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!!changes.cloudSpec.previousValue || (changes.cloudSpec.currentValue.digitalocean.token !== changes.cloudSpec.previousValue.digitalocean.token)) {
      this.reloadDigitaloceanSizes();
    }
  }

  getNodeProviderData(): NodeProviderData {
    let doTags: string[] = [];
    if ((this.doNodeForm.controls.tags.value).length > 0) {
      doTags = (this.doNodeForm.controls.tags.value).split(/[\s]?,[\s]?/);
    }

    return {
      spec: {
        digitalocean: {
          size: this.doNodeForm.controls.size.value,
          backups: this.doNodeForm.controls.backups.value,
          ipv6: this.doNodeForm.controls.ipv6.value,
          monitoring: this.doNodeForm.controls.monitoring.value,
          tags: doTags,
        },
      },
      valid: this.doNodeForm.valid,
    };
  }
}
