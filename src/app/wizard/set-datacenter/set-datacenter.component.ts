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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../core/services';
import {AuditLoggingSettings, Cluster, getClusterProvider} from '../../shared/entity/cluster';
import {Datacenter, getDatacenterProvider} from '../../shared/entity/datacenter';
import {AdmissionPluginUtils} from '../../shared/utils/admission-plugin-utils/admission-plugin-utils';

@Component({
  selector: 'km-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss'],
})
export class SetDatacenterComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  setDatacenterForm: FormGroup;
  datacenters: Datacenter[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _dcService: DatacenterService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.setDatacenterForm = new FormGroup({
      datacenter: new FormControl(this.cluster.spec.cloud.dc, [Validators.required]),
    });

    // Get all datacenters for the cluster cloud provider
    this._dcService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      const providerDatacenters: Datacenter[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }
        const provider = getDatacenterProvider(datacenter);
        const clusterProvider = getClusterProvider(this.cluster);
        if (provider === clusterProvider) {
          providerDatacenters.push(datacenter);
        }
      }
      this.datacenters = providerDatacenters;
    });

    this.setDatacenterForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.changeClusterDatacenter();
    });
  }

  changeClusterDatacenter(): void {
    let dc: Datacenter = null;
    for (const datacenter of this.datacenters) {
      if (this.setDatacenterForm.controls.datacenter.value === datacenter.metadata.name) {
        dc = datacenter;

        const auditLogging = dc.spec.enforceAuditLogging ? {enabled: true} : this.cluster.spec.auditLogging;

        const admissionPlugins = AdmissionPluginUtils.updateSelectedPluginArrayIfPSPEnforced(this.cluster, dc);

        this.enforceClusterProperties(auditLogging, admissionPlugins);
      }
    }
    this._wizardService.changeClusterDatacenter({
      datacenter: dc,
      valid: this.setDatacenterForm.valid,
    });
  }

  getLocationName(datacenter: Datacenter): string {
    if (datacenter.spec.location.includes('(')) {
      const splitted = datacenter.spec.location.replace(')', '').split('(');
      return '<span class="km-country-prefix">' + splitted[0].trim() + '</span><span>' + splitted[1].trim() + '</span>';
    }

    if (datacenter.spec.openstack && datacenter.spec.location.includes(' - ')) {
      const splitted = datacenter.spec.location.split(' - ');
      return '<span class="km-country-prefix">' + splitted[0].trim() + '</span><span>' + splitted[1].trim() + '</span>';
    }

    return datacenter.spec.location.replace('Azure', '');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  enforceClusterProperties(auditLogging: AuditLoggingSettings, admissionPlugins: string[]): void {
    this._wizardService.changeClusterSpec({
      name: this.cluster.name,
      type: this.cluster.type,
      labels: this.cluster.labels,
      version: this.cluster.spec.version,
      imagePullSecret: this.cluster.spec.openshift ? this.cluster.spec.openshift.imagePullSecret : '',
      admissionPlugins,
      auditLogging,
      valid: true,
    });
  }
}
