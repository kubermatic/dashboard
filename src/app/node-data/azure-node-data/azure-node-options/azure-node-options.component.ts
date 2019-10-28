import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';
import {addKeyValuePair, objectFromForm} from '../../../shared/utils/common-utils';

@Component({
  selector: 'kubermatic-azure-node-options',
  templateUrl: './azure-node-options.component.html',
})

export class AzureNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  form: FormGroup;
  tags: FormArray;
  datacenter: DataCenterEntity;
  hideOptional = true;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

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

    if (tagList.length === 0) {
      tagList.push(addKeyValuePair());
    }

    this.form = new FormGroup({
      assignPublicIP: new FormControl(this.nodeData.spec.cloud.azure.assignPublicIP),
      tags: tagList,
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.form.get('tags') as FormArray;
    this.tags.push(addKeyValuePair());
  }

  deleteTag(index: number): void {
    const arrayControl = this.form.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        azure: {
          size: this.nodeData.spec.cloud.azure.size,
          assignPublicIP: this.form.controls.assignPublicIP.value,
          tags: objectFromForm(this.form.controls.tags),
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
