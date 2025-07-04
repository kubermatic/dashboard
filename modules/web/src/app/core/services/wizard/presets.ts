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

import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {ProjectService} from '@core/services/project';
import {KubeVirt} from '@core/services/wizard/provider/kubevirt';
import {Nutanix} from '@core/services/wizard/provider/nutanix';
import {VMwareCloudDirector} from '@core/services/wizard/provider/vmware-cloud-director';
import {environment} from '@environments/environment';
import {Preset, PresetList, PresetModel, PresetStat, UpdatePresetStatusReq} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable} from 'rxjs';
import {Alibaba} from './provider/alibaba';
import {Anexia} from './provider/anexia';
import {AWS} from './provider/aws';
import {Azure} from './provider/azure';
import {Digitalocean} from './provider/digitalocean';
import {Equinix} from './provider/equinix';
import {GCP} from './provider/gcp';
import {Hetzner} from './provider/hetzner';
import {Openstack} from './provider/openstack';
import {Provider} from './provider/provider';
import {VSphere} from './provider/vsphere';

@Injectable()
export class PresetsService {
  // True - enabled, false - disabled
  readonly presetStatusChanges = new EventEmitter<boolean>();
  readonly presetChanges = new EventEmitter<string>();
  readonly presetDetailedChanges = new EventEmitter<Preset>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _projectService: ProjectService
  ) {}

  private _preset: string;
  private _presetDetailed: Preset;

  get preset(): string {
    return this._preset;
  }

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.next(preset);
  }

  get presetDetailed(): Preset {
    return this._presetDetailed;
  }

  set presetDetailed(preset: Preset) {
    this._presetDetailed = preset;
    this.presetDetailedChanges.next(preset);
  }

  enablePresets(enable: boolean): void {
    this.presetStatusChanges.next(enable);
  }

  provider(provider: NodeProvider.AWS): AWS;
  provider(provider: NodeProvider.AZURE): Azure;
  provider(provider: NodeProvider.DIGITALOCEAN): Digitalocean;
  provider(provider: NodeProvider.GCP): GCP;
  provider(provider: NodeProvider.HETZNER): Hetzner;
  provider(provider: NodeProvider.KUBEVIRT): KubeVirt;
  provider(provider: NodeProvider.OPENSTACK): Openstack;
  provider(provider: NodeProvider.EQUINIX): Equinix;
  provider(provider: NodeProvider.VSPHERE): VSphere;
  provider(provider: NodeProvider.ALIBABA): Alibaba;
  provider(provider: NodeProvider.ANEXIA): Anexia;
  provider(provider: NodeProvider.NUTANIX): Nutanix;
  provider(provider: NodeProvider.VMWARECLOUDDIRECTOR): VMwareCloudDirector;
  provider(provider: NodeProvider): Provider {
    switch (provider) {
      case NodeProvider.AWS:
        return new AWS(this._http, this._projectService.selectedProjectID, NodeProvider.AWS);
      case NodeProvider.AZURE:
        return new Azure(this._http, this._projectService.selectedProjectID, NodeProvider.AZURE);
      case NodeProvider.DIGITALOCEAN:
        return new Digitalocean(this._http, this._projectService.selectedProjectID, NodeProvider.DIGITALOCEAN);
      case NodeProvider.GCP:
        return new GCP(this._http, this._projectService.selectedProjectID, NodeProvider.GCP);
      case NodeProvider.HETZNER:
        return new Hetzner(this._http, this._projectService.selectedProjectID, NodeProvider.HETZNER);
      case NodeProvider.KUBEVIRT:
        return new KubeVirt(this._http, this._projectService.selectedProjectID, NodeProvider.KUBEVIRT);
      case NodeProvider.OPENSTACK:
        return new Openstack(this._http, this._projectService.selectedProjectID, NodeProvider.OPENSTACK);
      case NodeProvider.EQUINIX:
        return new Equinix(this._http, this._projectService.selectedProjectID, NodeProvider.EQUINIX);
      case NodeProvider.VSPHERE:
        return new VSphere(this._http, this._projectService.selectedProjectID, NodeProvider.VSPHERE);
      case NodeProvider.ALIBABA:
        return new Alibaba(this._http, this._projectService.selectedProjectID, NodeProvider.ALIBABA);
      case NodeProvider.ANEXIA:
        return new Anexia(this._http, this._projectService.selectedProjectID, NodeProvider.ANEXIA);
      case NodeProvider.NUTANIX:
        return new Nutanix(this._http, this._projectService.selectedProjectID, NodeProvider.NUTANIX);
      case NodeProvider.VMWARECLOUDDIRECTOR:
        return new VMwareCloudDirector(
          this._http,
          this._projectService.selectedProjectID,
          NodeProvider.VMWARECLOUDDIRECTOR
        );
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  presets(
    disabled?: boolean,
    admin?: boolean,
    provider: NodeProvider = NodeProvider.NONE,
    datacenter = '',
    projectID = ''
  ): Observable<PresetList> {
    let root = `${environment.newRestRoot}`;
    if (!admin) {
      root = `${environment.newRestRoot}/projects/${projectID}`;
    }

    if (!provider) {
      const url = `${root}/presets?disabled=${disabled}`;
      return this._http.get<PresetList>(url);
    }

    const url = `${root}/providers/${provider}/presets?datacenter=${datacenter}&disabled=${disabled}`;
    return this._http.get<PresetList>(url);
  }

  getPresetStatsBy(presetName: string): Observable<PresetStat> {
    const url = `${environment.newRestRoot}/presets/${presetName}/stats`;
    return this._http.get<PresetStat>(url);
  }

  getPresetByName(projectID: string, presetName: string): Observable<Preset> {
    const url = `${environment.newRestRoot}/projects/${projectID}/presets?name=${presetName}`;
    return this._http.get<Preset>(url);
  }

  updateStatus(
    presetName: string,
    status: UpdatePresetStatusReq,
    provider: NodeProvider = NodeProvider.NONE
  ): Observable<Preset> {
    const url = `${environment.newRestRoot}/presets/${presetName}/status?provider=${provider}`;
    return this._http.put<Preset>(url, status);
  }

  create(preset: PresetModel): Observable<Preset> {
    const url = `${environment.newRestRoot}/providers/${preset.spec.provider()}/presets`;
    return this._http.post<Preset>(url, preset);
  }

  update(preset: PresetModel): Observable<Preset> {
    const url = `${environment.newRestRoot}/providers/${preset.spec.provider()}/presets`;
    return this._http.put<Preset>(url, preset);
  }

  delete(presetName: string): Observable<void> {
    const url = `${environment.newRestRoot}/presets/${presetName}`;
    return this._http.delete<void>(url);
  }
}
