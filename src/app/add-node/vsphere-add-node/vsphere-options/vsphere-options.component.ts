import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { Subscription } from 'rxjs';
import { ApiService, DatacenterService, WizardService } from '../../../core/services';
import { NodeData, NodeProviderData } from '../../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../../shared/entity/ClusterEntity';
import { OperatingSystemSpec } from '../../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-vsphere-options',
  templateUrl: './vsphere-options.component.html',
  styleUrls: ['./vsphere-options.component.scss']
})

export class VSphereOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  public vsphereOptionsForm: FormGroup;
  public hideOptional = true;
  public defaultTemplate = 'ubuntu-template';
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private addNodeService: AddNodeService, private dcService: DatacenterService, private wizardService: WizardService) { }

  ngOnInit(): void {
    this.vsphereOptionsForm = new FormGroup({
      template: new FormControl(this.nodeData.node.spec.cloud.vsphere.template),
    });
    this.subscriptions.push(this.vsphereOptionsForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    }));

    this.subscriptions.push(this.addNodeService.nodeOperatingSystemDataChanges$.subscribe(data => {
      this.setImage(data);
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));

    this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    if (this.nodeData.node.spec.cloud.vsphere.template === '') {
      this.setImage(this.nodeData.node.spec.operatingSystem);
    }
  }

  setImage(operatingSystem: OperatingSystemSpec) {
    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe(res => {
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
        return this.vsphereOptionsForm.setValue({template: ubuntuTemplate});
      } else if (operatingSystem.centos) {
        this.defaultTemplate = centosTemplate;
        return this.vsphereOptionsForm.setValue({template: centosTemplate});
      } else if (operatingSystem.containerLinux) {
        this.defaultTemplate = coreosTemplate;
        return this.vsphereOptionsForm.setValue({template: coreosTemplate});
      }
    });
  }

  ngOnDestroy() {
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
          cpus: this.nodeData.node.spec.cloud.vsphere.cpus,
          memory: this.nodeData.node.spec.cloud.vsphere.memory,
          template: this.vsphereOptionsForm.controls.template.value,
        },
      },
      valid: this.vsphereOptionsForm.valid,
    };
  }
}
