import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs';
import { ApiService, DatacenterService } from '../../../core/services';
import { NodeData, NodeProviderData } from '../../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../../shared/entity/ClusterEntity';
import { OperatingSystemSpec } from '../../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-openstack-options',
  templateUrl: './openstack-options.component.html',
  styleUrls: ['./openstack-options.component.scss']
})

export class OpenstackOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  public osOptionsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService, private dcService: DatacenterService) { }

  ngOnInit(): void {
    this.osOptionsForm = new FormGroup({
      image: new FormControl(this.nodeData.node.spec.cloud.openstack.image),
    });
    this.subscriptions.push(this.osOptionsForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    }));

    this.subscriptions.push(this.addNodeService.nodeOperatingSystemDataChanges$.subscribe(data => {
      this.setImage(data);
      this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    }));

    this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    if (this.nodeData.node.spec.cloud.openstack.image === '') {
      this.setImage(this.nodeData.node.spec.operatingSystem);
    }
  }

  setImage(operatingSystem: OperatingSystemSpec): void {
    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe(res => {
      let coreosImage = '';
      let centosImage = '';
      let ubuntuImage = '';

      for (const i in res.spec.openstack.images) {
        if (i === 'coreos') {
          coreosImage = res.spec.openstack.images[i];
        } else if (i === 'centos') {
          centosImage = res.spec.openstack.images[i];
        } else if (i === 'ubuntu') {
          ubuntuImage = res.spec.openstack.images[i];
        }
      }

      if (operatingSystem.ubuntu) {
        return this.osOptionsForm.setValue({image: ubuntuImage});
      } else if (operatingSystem.centos) {
        return this.osOptionsForm.setValue({image: centosImage});
      } else if (operatingSystem.containerLinux) {
        return this.osOptionsForm.setValue({image: coreosImage});
      }
    });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getOsOptionsData(): NodeProviderData {
    return {
      spec: {
        openstack: {
          flavor: this.nodeData.node.spec.cloud.openstack.flavor,
          image: this.osOptionsForm.controls.image.value,
        },
      },
      valid: this.osOptionsForm.valid,
    };
  }
}
