import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-aws-node-options',
  templateUrl: './aws-node-options.component.html',
})

export class AWSNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  form: FormGroup;
  tags: FormArray;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.aws.tags) {
      if (this.nodeData.spec.cloud.aws.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.aws.tags[i]),
        }));
      }
    }

    this.form = new FormGroup({
      tags: tagList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.form.controls.tags.value) {
      if (this.form.controls.tags.value[i].key !== '' && this.form.controls.tags.value[i].value !== '') {
        tagMap[this.form.controls.tags.value[i].key] = this.form.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        aws: {
          instanceType: this.nodeData.spec.cloud.aws.instanceType,
          diskSize: this.nodeData.spec.cloud.aws.diskSize,
          ami: this.nodeData.spec.cloud.aws.ami,
          volumeType: this.nodeData.spec.cloud.aws.volumeType,
          subnetId: this.nodeData.spec.cloud.aws.subnetId,
          availabilityZone: this.nodeData.spec.cloud.aws.availabilityZone,
          tags: tagMap,
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
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
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
