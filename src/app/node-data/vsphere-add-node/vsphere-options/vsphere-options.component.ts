import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  defaultTemplate = '';
  private _unsubscribe = new Subject<void>();

  constructor(
      private addNodeService: NodeDataService, private dcService: DatacenterService,
      private wizardService: WizardService) {}

  ngOnInit(): void {
    this.vsphereOptionsForm = new FormGroup({
      diskSizeGB: new FormControl(this.nodeData.spec.cloud.vsphere.diskSizeGB),
      template: new FormControl(this.nodeData.spec.cloud.vsphere.template),
    });

    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe((res) => {
      this.defaultTemplate = res.spec.vsphere.templates.ubuntu;
    });

    this.vsphereOptionsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    });

    this.addNodeService.nodeOperatingSystemDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.setImage(data);
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    });

    this.wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    if (this.nodeData.spec.cloud.vsphere.template === '') {
      this.setImage(this.nodeData.spec.operatingSystem);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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

  getVSphereOptionsData(): NodeProviderData {
    const providerData: NodeProviderData = {
      spec: {
        vsphere: {
          cpus: this.nodeData.spec.cloud.vsphere.cpus,
          memory: this.nodeData.spec.cloud.vsphere.memory,
          template: this.vsphereOptionsForm.controls.template.value,
        },
      },
      valid: this.vsphereOptionsForm.valid,
    };

    if (!!this.vsphereOptionsForm.controls.diskSizeGB.value) {
      providerData.spec.vsphere.diskSizeGB = this.vsphereOptionsForm.controls.diskSizeGB.value;
    }

    return providerData;
  }
}
