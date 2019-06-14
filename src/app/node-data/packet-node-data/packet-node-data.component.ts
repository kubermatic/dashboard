import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-packet-node-data',
  templateUrl: './packet-node-data.component.html',
})

export class PacketNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;

  instanceTypes: string[] = this._wizard.provider(NodeProvider.PACKET).flavors();
  packetNodeForm: FormGroup;
  hideOptional = true;

  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _addNodeService: NodeDataService, private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.packetNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.packet.instanceType, Validators.required),
      tags: new FormControl(this.nodeData.spec.cloud.packet.tags.toString().replace(/\,/g, ', ')),
    });

    if (this.nodeData.spec.cloud.packet.instanceType === '') {
      this.packetNodeForm.controls.type.setValue(this.instanceTypes[0].id);
    }

    this.packetNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    let packetTags: string[] = [];
    if ((this.packetNodeForm.controls.tags.value).length > 0) {
      packetTags = (this.packetNodeForm.controls.tags.value).split(',').map(tag => tag.trim());
    }

    return {
      spec: {
        packet: {
          instanceType: this.packetNodeForm.controls.type.value,
          tags: packetTags,
        },
      },
      valid: this.packetNodeForm.valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
