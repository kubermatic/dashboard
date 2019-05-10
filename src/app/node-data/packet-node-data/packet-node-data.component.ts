import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
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
  tags: FormArray;
  hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: NodeDataService, private wizardService: WizardService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.packet.tags) {
      if (this.nodeData.spec.cloud.packet.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.packet.tags[i]),
        }));
      }
    }

    this.packetNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.packet.instanceType, Validators.required),
      tags: tagList,
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
    const tagMap = {};
    for (const i in this.packetNodeForm.controls.tags.value) {
      if (this.packetNodeForm.controls.tags.value[i].key !== '' &&
          this.packetNodeForm.controls.tags.value[i].value !== '') {
        tagMap[this.packetNodeForm.controls.tags.value[i].key] = this.packetNodeForm.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        packet: {
          instanceType: this.packetNodeForm.controls.type.value,
          tags: tagMap,
        },
      },
      valid: this.packetNodeForm.valid,
    };
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.packetNodeForm.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.packetNodeForm.get('tags') as FormArray;
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
