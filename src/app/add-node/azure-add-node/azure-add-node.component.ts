import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { ApiService, DatacenterService, WizardService } from '../../core/services';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { AzureSizes } from '../../shared/entity/provider/azure/AzureSizeEntity';

@Component({
  selector: 'kubermatic-azure-add-node',
  templateUrl: './azure-add-node.component.html',
  styleUrls: ['./azure-add-node.component.scss']
})

export class AzureAddNodeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public cloudSpec: CloudSpec;
  @Input() public nodeData: NodeData;
  @Input() public clusterName: string;

  public sizes: AzureSizes;
  public azureNodeForm: FormGroup;
  public tags: FormArray;
  public datacenter: DataCenterEntity;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService,
              private wizardService: WizardService,
              private api: ApiService,
              private dcService: DatacenterService) { }

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.node.spec.cloud.azure.tags) {
      if (this.nodeData.node.spec.cloud.azure.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.node.spec.cloud.azure.tags[i])
        }));
      }
    }

    this.azureNodeForm = new FormGroup({
      size: new FormControl(this.nodeData.node.spec.cloud.azure.size, Validators.required),
      assignPublicIP: new FormControl(this.nodeData.node.spec.cloud.azure.assignPublicIP),
      tags: tagList
    });

    this.subscriptions.push(this.azureNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));

    this.getDatacenter();
    this.reloadAzureSizes();
    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getDatacenter() {
    if (this.cloudSpec.dc) {
      this.subscriptions.push(this.dcService.getDataCenter(this.cloudSpec.dc).subscribe(data => {
        this.datacenter = data;
      }));
    }
  }

  reloadAzureSizes() {
    if (this.cloudSpec.dc) {
      if (!!this.clusterName && this.clusterName.length > 0) {
        if (this.cloudSpec.azure.clientID && this.cloudSpec.azure.clientSecret && this.cloudSpec.azure.subscriptionID && this.cloudSpec.azure.tenantID) {
          this.subscriptions.push(this.api.getAzureSizes(this.cloudSpec.dc, this.clusterName).subscribe(data => {
            this.sizes = data;
            this.azureNodeForm.controls.size.setValue(this.nodeData.node.spec.cloud.azure.size);
          }));
        }
      } else {
        // Cluster name is not yet available in create wizard and token has to be used here.
        if (this.cloudSpec.azure.clientID && this.cloudSpec.azure.clientSecret && this.cloudSpec.azure.subscriptionID && this.cloudSpec.azure.tenantID) {
          this.subscriptions.push(this.api.getAzureSizesInWizard(this.cloudSpec.azure.clientID, this.cloudSpec.azure.clientSecret, this.cloudSpec.azure.subscriptionID, this.cloudSpec.azure.tenantID, this.datacenter.spec.azure.location).subscribe(data => {
            this.sizes = data;
            this.azureNodeForm.controls.size.setValue(this.nodeData.node.spec.cloud.azure.size);
          }));
        }
      }
    } else {
      this.getDatacenter();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!!!changes.cloudSpec.previousValue || (changes.cloudSpec.currentValue.azure.clientID !== changes.cloudSpec.previousValue.azure.clientID) || (changes.cloudSpec.currentValue.azure.clientSecret !== changes.cloudSpec.previousValue.azure.clientSecret) || (changes.cloudSpec.currentValue.azure.subscriptionID !== changes.cloudSpec.previousValue.azure.subscriptionID) || (changes.cloudSpec.currentValue.azure.tenantID !== changes.cloudSpec.previousValue.azure.tenantID)) {
        this.reloadAzureSizes();
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

  getTagForm(form) {
    return form.get('tags').controls;
  }

  addTag() {
    this.tags = <FormArray>this.azureNodeForm.get('tags');
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl('')
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = <FormArray>this.azureNodeForm.get('tags');
    arrayControl.removeAt(index);
  }

  getNodeProviderData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.azureNodeForm.controls.tags.value) {
      if (this.azureNodeForm.controls.tags.value[i].key !== '' && this.azureNodeForm.controls.tags.value[i].value !== '') {
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
