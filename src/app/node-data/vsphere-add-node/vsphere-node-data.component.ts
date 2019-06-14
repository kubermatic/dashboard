import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-vsphere-node-data',
  templateUrl: './vsphere-node-data.component.html',
})

export class VSphereNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;

  vsphereNodeForm: FormGroup;

  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService) {}

  ngOnInit(): void {
    this.vsphereNodeForm = new FormGroup({
      cpu: new FormControl(
          this.nodeData.spec.cloud.vsphere.cpus, [Validators.required, Validators.min(1), Validators.max(8)]),
      memory: new FormControl(this.nodeData.spec.cloud.vsphere.memory, [Validators.required, Validators.min(512)]),
    });

    this.vsphereNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
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
        vsphere: {
          cpus: this.vsphereNodeForm.controls.cpu.value,
          memory: this.vsphereNodeForm.controls.memory.value,
          template: this.nodeData.spec.cloud.vsphere.template,
          diskSizeGB: this.nodeData.spec.cloud.vsphere.diskSizeGB,
        },
      },
      valid: this.vsphereNodeForm.valid,
    };
  }
}
