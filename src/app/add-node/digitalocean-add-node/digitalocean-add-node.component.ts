import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from '../../core/services';
import { NodeProviderData } from '../../shared/model/NodeSpecChange';
import { DigitaloceanOptions } from '../../shared/entity/node/DigitaloceanNodeSpec';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { DigitaloceanSizes } from '../../shared/entity/provider/digitalocean/DropletSizeEntity';

@Component({
  selector: 'kubermatic-digitalocean-add-node',
  templateUrl: './digitalocean-add-node.component.html',
  styleUrls: ['./digitalocean-add-node.component.scss']
})

export class DigitaloceanAddNodeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public cloudSpec: CloudSpec;
  public sizes: DigitaloceanSizes = { optimized: [], standard: [] };
  public loadingSizes = false;
  public doNodeForm: FormGroup = new FormGroup({
    size: new FormControl(0, Validators.required),
  });
  private doOptionsData: DigitaloceanOptions = {
    backups: false,
    ipv6: false,
    monitoring: false,
    tags: [],
  };
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.doNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.subscriptions.push(this.addNodeService.doOptionsDataChanges$.subscribe(data => {
      this.doOptionsData = data;
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
    return {
      spec: {
        digitalocean: {
          size: this.doNodeForm.controls.size.value,
          backups: this.doOptionsData.backups,
          ipv6: this.doOptionsData.ipv6,
          monitoring: this.doOptionsData.monitoring,
          tags: this.doOptionsData.tags,
        },
      },
      valid: this.doNodeForm.valid,
    };
  }
}
