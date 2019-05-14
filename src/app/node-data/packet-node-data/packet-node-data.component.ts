import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeInstanceFlavors} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-packet-node-data',
  templateUrl: './packet-node-data.component.html',
})

export class PacketNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  instanceTypes: string[] = NodeInstanceFlavors.Packet;
  packetNodeForm: FormGroup;
  hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: NodeDataService, private wizardService: WizardService) {}

  ngOnInit(): void {
    this.packetNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.packet.instanceType, Validators.required),
      tags: new FormControl(this.nodeData.spec.cloud.packet.tags.toString().replace(/\,/g, ', ')),
    });

    if (this.nodeData.spec.cloud.packet.instanceType === '') {
      this.packetNodeForm.controls.type.setValue(this.instanceTypes[0]);
    }

    this.subscriptions.push(this.packetNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    let packetTags: string[] = [];
    if ((this.packetNodeForm.controls.tags.value).length > 0) {
      packetTags = (this.packetNodeForm.controls.tags.value).split(/[\s]?,[\s]?/);
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
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
