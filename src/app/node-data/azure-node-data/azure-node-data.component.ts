import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, iif, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {AzureSizes} from '../../shared/entity/provider/azure/AzureSizeEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-azure-node-data',
  templateUrl: './azure-node-data.component.html',
  styleUrls: ['./azure-node-data.component.scss'],
})

export class AzureNodeDataComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  sizes: AzureSizes[] = [];
  azureNodeForm: FormGroup;
  tags: FormArray;
  datacenter: DataCenterEntity;
  hideOptional = true;
  loadingSizes = false;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _wizard: WizardService,
      private readonly _api: ApiService, private readonly _dcService: DatacenterService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.azure.tags) {
      if (this.nodeData.spec.cloud.azure.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.azure.tags[i]),
        }));
      }
    }

    this.azureNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.azure.size, Validators.required),
      assignPublicIP: new FormControl(this.nodeData.spec.cloud.azure.assignPublicIP),
      tags: tagList,
    });

    this.azureNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this.azureNodeForm.controls.size.setValue('');
      this.sizes = [];
      this.checkSizeState();
      if (data.cloudSpec.azure.clientID !== '' || data.cloudSpec.azure.clientSecret !== '' ||
          data.cloudSpec.azure.tenantID !== '' || data.cloudSpec.azure.subscriptionID !== '') {
        this.reloadAzureSizes();
      }
    });

    this.loadDatacenter();
    this.checkSizeState();
    this.reloadAzureSizes();
    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  loadDatacenter(): void {
    if (this.cloudSpec.dc) {
      this._dcService.getDataCenter(this.cloudSpec.dc).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
        this.datacenter = data;
      });
    }
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  isMissingCredentials(): boolean {
    return (!this.cloudSpec.azure.clientID || this.cloudSpec.azure.clientID === '') ||
        (!this.cloudSpec.azure.clientSecret || this.cloudSpec.azure.clientSecret === '') ||
        (!this.cloudSpec.azure.tenantID || this.cloudSpec.azure.tenantID === '') ||
        (!this.cloudSpec.azure.subscriptionID || this.cloudSpec.azure.subscriptionID === '');
  }

  getSizesFormState(): string {
    if ((!this.loadingSizes && this.isMissingCredentials()) && this.isInWizard()) {
      return 'Node Size*';
    } else if (this.loadingSizes) {
      return 'Loading sizes...';
    } else if (!this.loadingSizes && this.sizes.length === 0) {
      return 'No Sizes available';
    } else {
      return 'Node Size*';
    }
  }

  checkSizeState(): void {
    if (this.sizes.length === 0) {
      this.azureNodeForm.controls.size.disable();
    } else {
      this.azureNodeForm.controls.size.enable();
    }
  }

  showSizeHint(): boolean {
    return (!this.loadingSizes && this.isMissingCredentials()) && this.isInWizard();
  }

  reloadAzureSizes(): void {
    iif(() => !!this.cloudSpec.dc, this._dcService.getDataCenter(this.cloudSpec.dc), EMPTY)
        .pipe(switchMap(dc => {
          this.datacenter = dc;
          this.loadingSizes = true;

          return iif(
              () => this.isInWizard(),
              this._wizard.provider(NodeProvider.AZURE)
                  .clientID(this.cloudSpec.azure.clientID)
                  .clientSecret(this.cloudSpec.azure.clientSecret)
                  .subscriptionID(this.cloudSpec.azure.subscriptionID)
                  .tenantID(this.cloudSpec.azure.tenantID)
                  .location(this.datacenter.spec.azure.location)
                  .flavors(),
              this._api.getAzureSizes(this.projectId, this.seedDCName, this.clusterId));
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.sizes = data;
          if (this.nodeData.spec.cloud.azure.size === '') {
            this.azureNodeForm.controls.size.setValue(this.sizes[0].name);
          }

          this.loadingSizes = false;
          this.checkSizeState();
        }, () => this.loadingSizes = false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!!!changes.cloudSpec.previousValue ||
          (changes.cloudSpec.currentValue.azure.clientID !== changes.cloudSpec.previousValue.azure.clientID) ||
          (changes.cloudSpec.currentValue.azure.clientSecret !== changes.cloudSpec.previousValue.azure.clientSecret) ||
          (changes.cloudSpec.currentValue.azure.subscriptionID !==
           changes.cloudSpec.previousValue.azure.subscriptionID) ||
          (changes.cloudSpec.currentValue.azure.tenantID !== changes.cloudSpec.previousValue.azure.tenantID)) {
        this.reloadAzureSizes();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTagForm(form) {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.azureNodeForm.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.azureNodeForm.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  getNodeProviderData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.azureNodeForm.controls.tags.value) {
      if (this.azureNodeForm.controls.tags.value[i].key !== '' &&
          this.azureNodeForm.controls.tags.value[i].value !== '') {
        tagMap[this.azureNodeForm.controls.tags.value[i].key] = this.azureNodeForm.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        azure: {
          size: this.azureNodeForm.controls.size.value,
          assignPublicIP: this.azureNodeForm.controls.assignPublicIP.value,
          tags: tagMap,
        },
      },
      valid: this.azureNodeForm.valid,
    };
  }
}
