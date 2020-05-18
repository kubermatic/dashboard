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
  selector: 'km-vsphere-node-options',
  templateUrl: './vsphere-node-options.component.html',
})
export class VSphereNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  form: FormGroup;
  hideOptional = true;
  defaultTemplate = '';
  private _unsubscribe = new Subject<void>();

  constructor(
    private addNodeService: NodeDataService,
    private dcService: DatacenterService,
    private readonly _wizardService: WizardService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      diskSizeGB: new FormControl(this.nodeData.spec.cloud.vsphere.diskSizeGB),
      template: new FormControl(this.nodeData.spec.cloud.vsphere.template),
    });

    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe(res => {
      this.defaultTemplate = res.spec.vsphere.templates.ubuntu;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    });

    this.addNodeService.nodeOperatingSystemDataChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.setImage(data);
        this.addNodeService.changeNodeProviderData(
          this.getVSphereOptionsData()
        );
      });

    this.addNodeService.changeNodeProviderData(this.getVSphereOptionsData());
    if (this.nodeData.spec.cloud.vsphere.template === '') {
      this.setImage(this.nodeData.spec.operatingSystem);
    }

    this._wizardService.clusterSettingsFormViewChanged$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.hideOptional = data.hideOptional;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  setImage(operatingSystem: OperatingSystemSpec): void {
    this.dcService.getDataCenter(this.cloudSpec.dc).subscribe(res => {
      let coreosTemplate = '';
      let centosTemplate = '';
      let ubuntuTemplate = '';
      let rhelTemplate = '';
      let flatcarTemplate = '';

      for (const i in res.spec.vsphere.templates) {
        if (i === 'coreos') {
          coreosTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'centos') {
          centosTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'rhel') {
          rhelTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'ubuntu') {
          ubuntuTemplate = res.spec.vsphere.templates[i];
        } else if (i === 'flatcar') {
          flatcarTemplate = res.spec.vsphere.templates[i];
        }
      }

      if (operatingSystem.ubuntu) {
        this.defaultTemplate = ubuntuTemplate;
        return this.form.controls.template.setValue(ubuntuTemplate);
      } else if (operatingSystem.centos) {
        this.defaultTemplate = centosTemplate;
        return this.form.controls.template.setValue(centosTemplate);
      } else if (operatingSystem.containerLinux) {
        this.defaultTemplate = coreosTemplate;
        return this.form.controls.template.setValue(coreosTemplate);
      } else if (operatingSystem.rhel) {
        this.defaultTemplate = rhelTemplate;
        return this.form.controls.template.setValue(rhelTemplate);
      } else if (operatingSystem.flatcar) {
        this.defaultTemplate = flatcarTemplate;
        return this.form.controls.template.setValue(flatcarTemplate);
      }
    });
  }

  getVSphereOptionsData(): NodeProviderData {
    const isValid = this.nodeData.valid ? this.nodeData.valid : this.form.valid;
    const providerData: NodeProviderData = {
      spec: {
        vsphere: {
          cpus: this.nodeData.spec.cloud.vsphere.cpus,
          memory: this.nodeData.spec.cloud.vsphere.memory,
          template: this.form.controls.template.value,
        },
      },
      valid: isValid,
    };

    if (this.form.controls.diskSizeGB.value) {
      providerData.spec.vsphere.diskSizeGB = this.form.controls.diskSizeGB.value;
    }

    return providerData;
  }
}
