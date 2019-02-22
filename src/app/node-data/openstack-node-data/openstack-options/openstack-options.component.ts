import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../../shared/entity/ClusterEntity';
import {OperatingSystemSpec} from '../../../shared/entity/NodeEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-options',
  templateUrl: './openstack-options.component.html',
  styleUrls: ['./openstack-options.component.scss'],
})

export class OpenstackOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  osOptionsForm: FormGroup;
  tags: FormArray;
  hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(
      private addNodeService: NodeDataService, private dcService: DatacenterService,
      private wizardService: WizardService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.openstack.tags) {
      if (this.nodeData.spec.cloud.openstack.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.openstack.tags[i]),
        }));
      }
    }

    this.osOptionsForm = new FormGroup({
      image: new FormControl(this.nodeData.spec.cloud.openstack.image),
      tags: tagList,
    });

    this.subscriptions.push(this.osOptionsForm.valueChanges.subscribe((data) => {
      this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    }));

    this.subscriptions.push(this.addNodeService.nodeOperatingSystemDataChanges$.subscribe((data) => {
      if (this.nodeData.spec.cloud.openstack.image !== '' &&
          ((!!this.nodeData.spec.operatingSystem.ubuntu && !!data.ubuntu) ||
           (!!this.nodeData.spec.operatingSystem.centos && !!data.centos) ||
           (!!this.nodeData.spec.operatingSystem.containerLinux && !!data.containerLinux))) {
        this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
      } else {
        this.setImage(data);
        this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
      }
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));

    this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    if (this.nodeData.spec.cloud.openstack.image === '') {
      this.setImage(this.nodeData.spec.operatingSystem);
    }
  }

  setImage(operatingSystem: OperatingSystemSpec): void {
    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe((res) => {
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
        return this.osOptionsForm.setValue({image: ubuntuImage, tags: this.osOptionsForm.controls.tags.value});
      } else if (operatingSystem.centos) {
        return this.osOptionsForm.setValue({image: centosImage, tags: this.osOptionsForm.controls.tags.value});
      } else if (operatingSystem.containerLinux) {
        return this.osOptionsForm.setValue({image: coreosImage, tags: this.osOptionsForm.controls.tags.value});
      }
    });
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.osOptionsForm.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.osOptionsForm.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getOsOptionsData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.osOptionsForm.controls.tags.value) {
      if (this.osOptionsForm.controls.tags.value[i].key !== '' &&
          this.osOptionsForm.controls.tags.value[i].value !== '') {
        tagMap[this.osOptionsForm.controls.tags.value[i].key] = this.osOptionsForm.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        openstack: {
          flavor: this.nodeData.spec.cloud.openstack.flavor,
          image: this.osOptionsForm.controls.image.value,
          useFloatingIP: this.nodeData.spec.cloud.openstack.useFloatingIP,
          tags: tagMap,
        },
      },
      valid: this.osOptionsForm.valid,
    };
  }
}
