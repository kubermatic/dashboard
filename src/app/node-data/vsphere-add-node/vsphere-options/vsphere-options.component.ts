import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../../shared/entity/ClusterEntity';
import {OperatingSystemSpec} from '../../../shared/entity/NodeEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-vsphere-options',
  templateUrl: './vsphere-options.component.html',
})

export class VSphereOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  vsphereOptionsForm: FormGroup;
  hideOptional = true;
  defaultTemplate = 'ubuntu-template';
  private subscriptions: Subscription[] = [];

  constructor(
      private addNodeService: NodeDataService, private dcService: DatacenterService,
      private wizardService: WizardService) {}

  ngOnInit(): void {
    this.vsphereOptionsForm = new FormGroup({
      diskSizeGB: new FormControl(this.nodeData.spec.cloud.vsphere.diskSizeGB),
      template: new FormControl(this.nodeData.spec.cloud.vsphere.template),
    });

    this.subscriptions.push(this.vsphereOptionsForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    }));

    this.subscriptions.push(this.addNodeService.nodeOperatingSystemDataChanges$.subscribe((data) => {
      this.setImage(data);
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));

    this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    if (this.nodeData.spec.cloud.vsphere.template === '') {
      this.setImage(this.nodeData.spec.operatingSystem);
    }
  }

  setImage(operatingSystem: OperatingSystemSpec): void {
    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe((res) => {
      let coreosTemplate = '';
      let centosTemplate = '';
      let ubuntuTemplate = '';

      for (const i in res.spec.vsphere.templates) {
        if (i === 'coreos') {
          coreosTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'centos') {
          centosTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'ubuntu') {
          ubuntuTemplate = res.spec.vsphere.templates[i];
        }
      }

      if (operatingSystem.ubuntu) {
        this.defaultTemplate = ubuntuTemplate;
        return this.vsphereOptionsForm.controls.template.setValue(ubuntuTemplate);
      } else if (operatingSystem.centos) {
        this.defaultTemplate = centosTemplate;
        return this.vsphereOptionsForm.controls.template.setValue(centosTemplate);
      } else if (operatingSystem.containerLinux) {
        this.defaultTemplate = coreosTemplate;
        return this.vsphereOptionsForm.controls.template.setValue(coreosTemplate);
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

  getVSphereOptionsData(): NodeProviderData {
    return {
      spec: {
        vsphere: {
          cpus: this.nodeData.spec.cloud.vsphere.cpus,
          memory: this.nodeData.spec.cloud.vsphere.memory,
          template: this.vsphereOptionsForm.controls.template.value,
          diskSizeGB: this.vsphereOptionsForm.controls.diskSizeGB.value,
        },
      },
      valid: this.vsphereOptionsForm.valid,
    };
  }
}
