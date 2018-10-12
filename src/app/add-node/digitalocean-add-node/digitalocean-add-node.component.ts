import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { DigitaloceanSizes } from '../../shared/entity/provider/digitalocean/DropletSizeEntity';

@Component({
  selector: 'kubermatic-digitalocean-add-node',
  templateUrl: './digitalocean-add-node.component.html',
  styleUrls: ['./digitalocean-add-node.component.scss']
})

export class DigitaloceanAddNodeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() public projectId: string;
  @Input() public clusterId: string;
  @Input() public seedDCName: string;

  public sizes: DigitaloceanSizes = { optimized: [], standard: [] };
  public doNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.doNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.node.spec.cloud.digitalocean.size, Validators.required),
    });

    this.subscriptions.push(this.doNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.reloadDigitaloceanSizes();
    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  reloadDigitaloceanSizes() {
    if (this.isInWizard()) {
      if (this.cloudSpec.digitalocean.token) {
        this.subscriptions.push(this.api.getDigitaloceanSizesForWizard(this.cloudSpec.digitalocean.token).subscribe(data => {
          this.sizes = data;
          this.doNodeForm.controls.size.setValue(this.nodeData.node.spec.cloud.digitalocean.size);
        }));
      }
    } else {
      if (this.cloudSpec.digitalocean.token) {
        this.subscriptions.push(this.api.getDigitaloceanSizes(this.projectId, this.seedDCName, this.clusterId).subscribe(data => {
          this.sizes = data;
          this.doNodeForm.controls.size.setValue(this.nodeData.node.spec.cloud.digitalocean.size);
        }));
      }
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
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!!!changes.cloudSpec.previousValue || (changes.cloudSpec.currentValue.digitalocean.token !== changes.cloudSpec.previousValue.digitalocean.token)) {
        this.reloadDigitaloceanSizes();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        digitalocean: {
          size: this.doNodeForm.controls.size.value,
          backups: this.nodeData.node.spec.cloud.digitalocean.backups,
          ipv6: this.nodeData.node.spec.cloud.digitalocean.ipv6,
          monitoring: this.nodeData.node.spec.cloud.digitalocean.monitoring,
          tags: this.nodeData.node.spec.cloud.digitalocean.tags,
        },
      },
      valid: this.doNodeForm.valid,
    };
  }
}
