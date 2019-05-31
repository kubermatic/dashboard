import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-gcp-node-data',
  templateUrl: './gcp-node-data.component.html',
  styleUrls: ['./gcp-node-data.component.scss'],
})

export class GCPNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  diskTypes: string[] = ['local-ssd', 'pd-ssd', 'pd-standard'];
  gcpNodeForm: FormGroup;
  labels: FormArray;
  hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: NodeDataService, private wizardService: WizardService) {}

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

    this.gcpNodeForm = new FormGroup({
      diskSize: new FormControl(this.nodeData.spec.cloud.gcp.diskSize, Validators.required),
      diskType: new FormControl(this.nodeData.spec.cloud.gcp.diskType, Validators.required),
      machineType: new FormControl(this.nodeData.spec.cloud.gcp.machineType, Validators.required),
      preemptible: new FormControl(this.nodeData.spec.cloud.gcp.preemptible, Validators.required),
      zone: new FormControl(this.nodeData.spec.cloud.gcp.zone, Validators.required),
      tags: new FormControl(this.nodeData.spec.cloud.gcp.tags.toString().replace(/\,/g, ', ')),
      labels: labelList,
    });

    if (this.nodeData.spec.cloud.gcp.diskType === '') {
      this.gcpNodeForm.controls.diskType.setValue(this.diskTypes[0]);
    }

    this.subscriptions.push(this.gcpNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    const labelsMap = {};
    for (const i in this.gcpNodeForm.controls.labels.value) {
      if (this.gcpNodeForm.controls.labels.value[i].key !== '' &&
          this.gcpNodeForm.controls.labels.value[i].value !== '') {
        labelsMap[this.gcpNodeForm.controls.labels.value[i].key] = this.gcpNodeForm.controls.labels.value[i].value;
      }
    }

    let gcpTags: string[] = [];
    if ((this.gcpNodeForm.controls.tags.value).length > 0) {
      gcpTags = (this.gcpNodeForm.controls.tags.value).split(',').map(tag => tag.trim());
      gcpTags.map(tag => tag.trim());
    }

    return {
      spec: {
        gcp: {
          diskSize: this.gcpNodeForm.controls.diskSize.value,
          diskType: this.gcpNodeForm.controls.diskType.value,
          machineType: this.gcpNodeForm.controls.machineType.value,
          preemptible: this.gcpNodeForm.controls.preemptible.value,
          zone: this.gcpNodeForm.controls.zone.value,
          labels: labelsMap,
          tags: gcpTags,
        },
      },
      valid: this.gcpNodeForm.valid,
    };
  }

  getLabelForm(form): any {
    return form.get('labels').controls;
  }

  addLabel(): void {
    this.labels = this.gcpNodeForm.get('labels') as FormArray;
    this.labels.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteLabel(index: number): void {
    const arrayControl = this.gcpNodeForm.get('labels') as FormArray;
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
