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
import {environment} from '@environments/environment';
import {Preset, PresetList, PresetModel, UpdatePresetStatusReq} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable} from 'rxjs';
import {Alibaba} from './provider/alibaba';
import {AWS} from './provider/aws';
import {Anexia} from './provider/anexia';
import {Azure} from './provider/azure';
import {Digitalocean} from './provider/digitalocean';
import {GCP} from './provider/gcp';
import {Hetzner} from './provider/hetzner';
import {Openstack} from './provider/openstack';
import {Equinix} from './provider/equinix';
import {Provider} from './provider/provider';
import {VSphere} from './provider/vsphere';
import {KubeVirt} from '@core/services/wizard/provider/kubevirt';
import {Nutanix} from '@core/services/wizard/provider/nutanix';

@Injectable()
export class PresetsService {
  // True - enabled, false - disabled
  readonly presetStatusChanges = new EventEmitter<boolean>();
  readonly presetChanges = new EventEmitter<string>();

  constructor(private readonly _http: HttpClient) {}

  private _preset: string;

  get preset(): string {
    return this._preset;
  }

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.next(preset);
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
  provider(provider: NodeProvider): Provider {
    switch (provider) {
      case NodeProvider.AWS:
        return new AWS(this._http, NodeProvider.AWS);
      case NodeProvider.AZURE:
        return new Azure(this._http, NodeProvider.AZURE);
      case NodeProvider.DIGITALOCEAN:
        return new Digitalocean(this._http, NodeProvider.DIGITALOCEAN);
      case NodeProvider.GCP:
        return new GCP(this._http, NodeProvider.GCP);
      case NodeProvider.HETZNER:
        return new Hetzner(this._http, NodeProvider.HETZNER);
      case NodeProvider.KUBEVIRT:
        return new Hetzner(this._http, NodeProvider.KUBEVIRT);
      case NodeProvider.OPENSTACK:
        return new Openstack(this._http, NodeProvider.OPENSTACK);
      case NodeProvider.EQUINIX:
        return new Equinix(this._http, NodeProvider.EQUINIX);
      case NodeProvider.VSPHERE:
        return new VSphere(this._http, NodeProvider.VSPHERE);
      case NodeProvider.ALIBABA:
        return new Alibaba(this._http, NodeProvider.ALIBABA);
      case NodeProvider.ANEXIA:
        return new Anexia(this._http, NodeProvider.ANEXIA);
      case NodeProvider.NUTANIX:
        return new Nutanix(this._http, NodeProvider.NUTANIX);
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  presets(disabled?: boolean, provider: NodeProvider = NodeProvider.NONE, datacenter = ''): Observable<PresetList> {
    if (!provider) {
      const url = `${environment.newRestRoot}/presets?disabled=${disabled}`;
      return this._http.get<PresetList>(url);
    }

    const url = `${environment.newRestRoot}/providers/${provider}/presets?datacenter=${datacenter}&disabled=${disabled}`;
    return this._http.get<PresetList>(url);
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
}
