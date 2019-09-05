import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-gcp-node-options',
  templateUrl: './gcp-node-options.component.html',
})

export class GCPNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  form: FormGroup;
  labels: FormArray;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _nodeDataService: NodeDataService) {}

  ngOnInit(): void {
    const labelList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.gcp.labels) {
      if (this.nodeData.spec.cloud.gcp.labels.hasOwnProperty(i)) {
        labelList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.gcp.labels[i]),
        }));
      }
    }

    this.form = new FormGroup({
      tags: new FormControl(this.nodeData.spec.cloud.gcp.tags.toString().replace(/\,/g, ', ')),
      labels: labelList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    const labelsMap = {};
    for (const i in this.form.controls.labels.value) {
      if (this.form.controls.labels.value[i].key !== '' && this.form.controls.labels.value[i].value !== '') {
        labelsMap[this.form.controls.labels.value[i].key] = this.form.controls.labels.value[i].value;
      }
    }

    let gcpTags: string[] = [];
    if ((this.form.controls.tags.value).length > 0) {
      gcpTags = (this.form.controls.tags.value).split(',').map(tag => tag.trim());
      gcpTags.map(tag => tag.trim());
    }

    return {
      spec: {
        gcp: {
          diskSize: this.nodeData.spec.cloud.gcp.diskSize,
          diskType: this.nodeData.spec.cloud.gcp.diskType,
          machineType: this.nodeData.spec.cloud.gcp.machineType,
          preemptible: this.nodeData.spec.cloud.gcp.preemptible,
          zone: this.nodeData.spec.cloud.gcp.zone,
          labels: labelsMap,
          tags: gcpTags,
        },
      },
      valid: this.nodeData.valid,
    };
  }

  getLabelForm(form): any {
    return form.get('labels').controls;
  }

  addLabel(): void {
    this.labels = this.form.get('labels') as FormArray;
    this.labels.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteLabel(index: number): void {
    const arrayControl = this.form.get('labels') as FormArray;
    arrayControl.removeAt(index);
  }
}
