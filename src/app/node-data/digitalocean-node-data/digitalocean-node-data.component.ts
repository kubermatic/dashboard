import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ApiService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {DigitaloceanSizes} from '../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-digitalocean-node-data',
  templateUrl: './digitalocean-node-data.component.html',
})

export class DigitaloceanNodeDataComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  sizes: DigitaloceanSizes = {optimized: [], standard: []};
  doNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: NodeDataService) {}

  ngOnInit(): void {
    this.doNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.digitalocean.size, Validators.required),
    });

    this.subscriptions.push(this.doNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.checkSizeState();
    this.reloadDigitaloceanSizes();
    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  checkSizeState(): void {
    if (this.sizes.standard.length === 0 && this.sizes.optimized.length === 0) {
      this.doNodeForm.controls.size.disable();
    } else {
      this.doNodeForm.controls.size.enable();
    }
  }

  getSizesFormState(): string {
    if ((!this.cloudSpec.digitalocean.token || this.cloudSpec.digitalocean.token.length === 0) && this.isInWizard()) {
      return 'Please enter a valid token first!';
    } else if (this.sizes.standard.length === 0 && this.sizes.optimized.length === 0) {
      return 'Loading sizes...';
    } else {
      return 'Node Size*:';
    }
  }

  reloadDigitaloceanSizes(): void {
    if (this.isInWizard()) {
      if (this.cloudSpec.digitalocean.token) {
        this.subscriptions.push(
            this.api.getDigitaloceanSizesForWizard(this.cloudSpec.digitalocean.token).subscribe((data) => {
              this.sizes = data;
              this.doNodeForm.controls.size.setValue(this.nodeData.spec.cloud.digitalocean.size);
              this.checkSizeState();
            }));
      }
    } else {
      this.subscriptions.push(
          this.api.getDigitaloceanSizes(this.projectId, this.seedDCName, this.clusterId).subscribe((data) => {
            this.sizes = data;
            this.doNodeForm.controls.size.setValue(this.nodeData.spec.cloud.digitalocean.size);
            this.checkSizeState();
          }));
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!!!changes.cloudSpec.previousValue ||
          (changes.cloudSpec.currentValue.digitalocean.token !== changes.cloudSpec.previousValue.digitalocean.token)) {
        this.reloadDigitaloceanSizes();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        digitalocean: {
          size: this.doNodeForm.controls.size.value,
          backups: this.nodeData.spec.cloud.digitalocean.backups,
          ipv6: this.nodeData.spec.cloud.digitalocean.ipv6,
          monitoring: this.nodeData.spec.cloud.digitalocean.monitoring,
          tags: this.nodeData.spec.cloud.digitalocean.tags,
        },
      },
      valid: this.doNodeForm.valid,
    };
  }
}
