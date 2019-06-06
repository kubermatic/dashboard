import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ApiService, WizardService} from '../../core/services';
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
  loadingSizes = false;
  private _unsubscribe = new Subject<void>();
  constructor(private api: ApiService, private addNodeService: NodeDataService, private wizardService: WizardService) {}

  ngOnInit(): void {
    this.doNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.digitalocean.size, Validators.required),
    });

    this.doNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.addNodeService.changeNodeProviderData(this.getNodeProviderData()));

    this.subscriptions.push(this.wizardService.clusterProviderSettingsFormChanges$.subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this.doNodeForm.controls.size.setValue('');
      this.sizes = {optimized: [], standard: []};
      this.checkSizeState();
      if (data.cloudSpec.digitalocean.token !== '') {
        this.reloadDigitaloceanSizes();
      }
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
    if ((!this.loadingSizes &&
         (!this.cloudSpec.digitalocean.token || this.cloudSpec.digitalocean.token.length === 0)) &&
        this.isInWizard()) {
      return 'Node Size*';
    } else if (this.loadingSizes) {
      return 'Loading sizes...';
    } else if (!this.loadingSizes && this.sizes.standard.length === 0 && this.sizes.optimized.length === 0) {
      return 'No Sizes available';
    } else {
      return 'Node Size*';
    }
  }

  showSizeHint(): boolean {
    return (!this.loadingSizes && (!this.cloudSpec.digitalocean.token || this.cloudSpec.digitalocean.token === '')) &&
        this.isInWizard();
  }

  reloadDigitaloceanSizes(): void {
    if (this.isInWizard()) {
      if (this.cloudSpec.digitalocean.token) {
        this.loadingSizes = true;
        this.api.getDigitaloceanSizesForWizard(this.cloudSpec.digitalocean.token)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
              this.sizes = data;
              if (this.nodeData.spec.cloud.digitalocean.size === '') {
                this.doNodeForm.controls.size.setValue(this.sizes.standard[0].slug);
              }
              this.loadingSizes = false;
              this.checkSizeState();
            }, err => this.loadingSizes = false);
      }
    } else {
      this.loadingSizes = true;
      this.api.getDigitaloceanSizes(this.projectId, this.seedDCName, this.clusterId)
          .pipe(takeUntil(this._unsubscribe))
          .subscribe((data) => {
            this.sizes = data;
            if (this.nodeData.spec.cloud.digitalocean.size === '') {
              this.doNodeForm.controls.size.setValue(this.sizes.standard[0].slug);
            }
            this.loadingSizes = false;
            this.checkSizeState();
          }, err => this.loadingSizes = false);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
