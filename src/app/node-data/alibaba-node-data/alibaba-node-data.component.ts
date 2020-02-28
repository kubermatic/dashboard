import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AlibabaInstanceType} from '../../shared/entity/provider/alibaba/Alibaba';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-alibaba-node-data',
  templateUrl: './alibaba-node-data.component.html',
})

export class AlibabaNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;
  @Input() projectId: string;
  @Input() seedDCName: string;

  instanceTypes: AlibabaInstanceType[] = [];
  diskTypes: string[] = ['cloud', 'cloud_efficiency', 'cloud_ssd', 'cloud_essd', 'san_ssd', 'san_efficiency'];
  form: FormGroup;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      instanceType: new FormControl(this.nodeData.spec.cloud.alibaba.instanceType, Validators.required),
      diskSize: new FormControl(this.nodeData.spec.cloud.alibaba.diskSize, Validators.required),
      diskType: new FormControl(this.nodeData.spec.cloud.alibaba.diskType, Validators.required),
      internetMaxBandwidthOut:
          new FormControl(this.nodeData.spec.cloud.alibaba.internetMaxBandwidthOut, Validators.required),
      vSwitchID: new FormControl(this.nodeData.spec.cloud.alibaba.vSwitchID, Validators.required),
      zoneID: new FormControl(this.nodeData.spec.cloud.alibaba.zoneID, Validators.required),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.nodeProviderDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.nodeData.spec.cloud.alibaba = data.spec.alibaba;
      this.nodeData.valid = data.valid;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        alibaba: {
          instanceType: this.form.controls.instanceType.value,
          diskSize: this.form.controls.diskSize.value,
          diskType: this.form.controls.diskType.value,
          internetMaxBandwidthOut: this.form.controls.internetMaxBandwidthOut.value,
          vSwitchID: this.form.controls.vSwitchID.value,
          zoneID: this.form.controls.zoneID.value,
          labels: this.nodeData.spec.cloud.alibaba.labels,
        },
      },
      valid: this.form.valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
