import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';
import {addKeyValuePair, objectFromForm} from '../../../shared/utils/common-utils';

@Component({
  selector: 'kubermatic-aws-node-options',
  templateUrl: './aws-node-options.component.html',
})

export class AWSNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() isInWizard: boolean;

  hideOptional = true;
  form: FormGroup;
  tags: FormArray;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    const isInEdit = !!this.nodeData.name;  // Existing node deployment will always have assigned name.
    const assignPublicIP = isInEdit ? this.nodeData.spec.cloud.aws.assignPublicIP : true;  // Default to true.

    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.aws.tags) {
      if (this.nodeData.spec.cloud.aws.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.aws.tags[i]),
        }));
      }
    }

    if (tagList.length === 0) {
      tagList.push(addKeyValuePair());
    }

    this.form = new FormGroup({
      assignPublicIP: new FormControl(assignPublicIP),
      tags: tagList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._addNodeService.nodeProviderDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.nodeData.spec.cloud.aws = data.spec.aws;
      this.nodeData.valid = data.valid;
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        aws: {
          instanceType: this.nodeData.spec.cloud.aws.instanceType,
          diskSize: this.nodeData.spec.cloud.aws.diskSize,
          ami: this.nodeData.spec.cloud.aws.ami,
          volumeType: this.nodeData.spec.cloud.aws.volumeType,
          subnetID: this.nodeData.spec.cloud.aws.subnetID,
          availabilityZone: this.nodeData.spec.cloud.aws.availabilityZone,
          assignPublicIP: this.form.controls.assignPublicIP.value,
          tags: objectFromForm(this.form.controls.tags),
        },
      },
      valid: this.nodeData.valid,
    };
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

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
