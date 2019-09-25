import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-kubevirt-node-data',
  templateUrl: './kubevirt-node-data.component.html',
})

export class KubeVirtNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;
  formGroup: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cpus: new FormControl(this.nodeData.spec.cloud.kubevirt.cpus, [Validators.required]),
      memory: new FormControl(this.nodeData.spec.cloud.kubevirt.memory, [Validators.required]),
      namespace: new FormControl(this.nodeData.spec.cloud.kubevirt.namespace, [Validators.required]),
      sourceURL: new FormControl(this.nodeData.spec.cloud.kubevirt.sourceURL, [Validators.required]),
      storageClassName: new FormControl(this.nodeData.spec.cloud.kubevirt.storageClassName, [Validators.required]),
      pvcSize: new FormControl(this.nodeData.spec.cloud.kubevirt.pvcSize, [Validators.required]),
    });

    this.formGroup.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        kubevirt: {
          cpus: this.formGroup.controls.cpus.value,
          memory: this.formGroup.controls.memory.value,
          namespace: this.formGroup.controls.namespace.value,
          sourceURL: this.formGroup.controls.sourceURL.value,
          storageClassName: this.formGroup.controls.storageClassName.value,
          pvcSize: this.formGroup.controls.pvcSize.value,

        },
      },
      valid: this.formGroup.valid,
    };
  }
}
