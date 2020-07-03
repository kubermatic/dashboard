// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {filter, switchMap, takeUntil, tap} from 'rxjs/operators';
import {DatacenterService} from '../../../../core/services';
import {DatacenterOperatingSystemOptions} from '../../../../shared/entity/datacenter';
import {NodeCloudSpec, NodeSpec, VSphereNodeSpec} from '../../../../shared/entity/node';
import {OperatingSystem} from '../../../../shared/model/NodeProviderConstants';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../wizard-new/service/cluster';
import {NodeDataService} from '../../../service/service';
import {ClusterType} from '../../../../shared/entity/cluster';

enum Controls {
  DiskSizeGB = 'diskSizeGB',
  Template = 'template',
}

@Component({
  selector: 'km-vsphere-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class VSphereExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _defaultTemplate = '';
  private _templates: DatacenterOperatingSystemOptions;

  readonly Controls = Controls;

  get template(): string {
    return this.form.get(Controls.Template).value ? this.form.get(Controls.Template).value : this._defaultTemplate;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _datacenterService: DatacenterService,
    private readonly _clusterService: ClusterService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.DiskSizeGB]: this._builder.control(1),
      [Controls.Template]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
      .pipe(tap(dc => (this._templates = dc.spec.vsphere.templates)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultTemplate(OperatingSystem.Ubuntu));

    this._clusterService.clusterTypeChanges
      .pipe(filter(_ => !!this._templates))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._isOpenshiftCluster()
          ? this._setDefaultTemplate(OperatingSystem.CentOS)
          : this._setDefaultTemplate(OperatingSystem.Ubuntu)
      );

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._templates))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultTemplate.bind(this));

    merge(this.form.get(Controls.DiskSizeGB).valueChanges, this.form.get(Controls.Template).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _isOpenshiftCluster(): boolean {
    return this._clusterService.clusterType === ClusterType.OpenShift;
  }

  private _setDefaultTemplate(os: OperatingSystem): void {
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
      case OperatingSystem.ContainerLinux:
        this._defaultTemplate = this._templates.coreos;
        break;
      case OperatingSystem.Flatcar:
        this._defaultTemplate = this._templates.flatcar;
        break;
      default:
        this._defaultTemplate = this._templates.ubuntu;
    }

    this.form.get(Controls.Template).setValue(this._defaultTemplate);
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vsphere: {
            template: this.template,
            diskSizeGB: this.form.get(Controls.DiskSizeGB).value,
          } as VSphereNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
