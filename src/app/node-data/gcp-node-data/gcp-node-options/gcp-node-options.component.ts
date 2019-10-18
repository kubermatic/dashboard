import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';
import {addKeyValuePair, objectFromForm} from '../../../shared/utils/common-utils';

@Component({
  selector: 'kubermatic-gcp-node-options',
  templateUrl: './gcp-node-options.component.html',
})

export class GCPNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  form: FormGroup;
  labels: FormArray;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _nodeDataService: NodeDataService, private readonly _wizardService: WizardService) {}

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

    if (labelList.length === 0) {
      labelList.push(addKeyValuePair());
    }

    this.form = new FormGroup({
      tags: new FormControl(this.nodeData.spec.cloud.gcp.tags.toString().replace(/\,/g, ', ')),
      labels: labelList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
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
          labels: objectFromForm(this.form.controls.labels),
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
    this.labels.push(addKeyValuePair());
  }

  deleteLabel(index: number): void {
    const arrayControl = this.form.get('labels') as FormArray;
    arrayControl.removeAt(index);
  }
}
