import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs/Subscription';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { WizardService } from '../../core/services/wizard/wizard.service';

@Component({
  selector: 'kubermatic-azure-add-node',
  templateUrl: './azure-add-node.component.html',
  styleUrls: ['./azure-add-node.component.scss']
})

export class AzureAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  @Input() public nodeData: NodeData;

  public sizes: string[] = NodeInstanceFlavors.Azure;
  public azureNodeForm: FormGroup;
  public tags: FormArray;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService, private wizardService: WizardService) { }

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

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
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
