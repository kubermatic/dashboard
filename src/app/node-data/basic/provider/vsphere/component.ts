// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {NodeCloudSpec, NodeSpec, VSphereNodeSpec} from '@shared/entity/node';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  CPU = 'cpu',
  Memory = 'memory',
  Template = 'template',
  DiskSizeGB = 'diskSizeGB',
}

@Component({
  selector: 'km-vsphere-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereBasicNodeDataComponent),
      multi: true,
    },
  ],
})
export class VSphereBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  private readonly _minMemory = 512;
  private readonly _defaultCPUCount = 2;
  private readonly _defaultMemory = 4096;
  private readonly _defaultDiskSize = 10;

  private _defaultTemplate = '';
  private _templates: DatacenterOperatingSystemOptions;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService
  ) {
    super();
  }

  get template(): string {
    return this.form.get(Controls.Template).value ? this.form.get(Controls.Template).value : this._defaultTemplate;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPU]: this._builder.control(this._defaultCPUCount, [Validators.required, Validators.min(1)]),
      [Controls.Memory]: this._builder.control(this._defaultMemory, [
        Validators.required,
        Validators.min(this._minMemory),
      ]),
      [Controls.Template]: this._builder.control('', Validators.required),
      [Controls.DiskSizeGB]: this._builder.control(this._defaultDiskSize, [Validators.required, Validators.min(1)]),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.CPU).valueChanges,
      this.form.get(Controls.Template).valueChanges,
      this.form.get(Controls.DiskSizeGB).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => (this._templates = dc.spec.vsphere.templates)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultTemplate());

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._templates))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultTemplate.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.vsphere) {
      this.form.get(Controls.CPU).setValue(this._nodeDataService.nodeData.spec.cloud.vsphere.cpus);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.vsphere.memory);
      this.form.get(Controls.DiskSizeGB).setValue(this._nodeDataService.nodeData.spec.cloud.vsphere.diskSizeGB);
    }
  }

  private _setDefaultTemplate(os: OperatingSystem = undefined): void {
    os = os ? os : this._getFirstAvailableOS();
    switch (os) {
      case OperatingSystem.CentOS:
        this._defaultTemplate = this._templates.centos;
        break;
      case OperatingSystem.Ubuntu:
        this._defaultTemplate = this._templates.ubuntu;
        break;
      case OperatingSystem.SLES:
        this._defaultTemplate = this._templates.sles;
        break;
      case OperatingSystem.Flatcar:
        this._defaultTemplate = this._templates.flatcar;
        break;
      case OperatingSystem.RockyLinux:
        this._defaultTemplate = this._templates.rockyLinux;
        break;
      default:
        this._defaultTemplate = '';
    }

    this.form.get(Controls.Template).setValue(this._defaultTemplate);
  }

  private _getFirstAvailableOS(): OperatingSystem {
    if (this._templates.ubuntu) {
      return OperatingSystem.Ubuntu;
    } else if (this._templates.centos) {
      return OperatingSystem.CentOS;
    } else if (this._templates.sles) {
      return OperatingSystem.SLES;
    } else if (this._templates.flatcar) {
      return OperatingSystem.Flatcar;
    } else if (this._templates.rockyLinux) {
      return OperatingSystem.RockyLinux;
    }
    return undefined;
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vsphere: {
            template: this.template,
            cpus: this.form.get(Controls.CPU).value,
            memory: this.form.get(Controls.Memory).value,
            diskSizeGB: this.form.get(Controls.DiskSizeGB).value,
          } as VSphereNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
