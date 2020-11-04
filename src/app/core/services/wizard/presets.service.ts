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

import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {environment} from '@environments/environment';
import {PresetList} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Alibaba} from './provider/alibaba';
import {AWS} from './provider/aws';
import {Azure} from './provider/azure';
import {Digitalocean} from './provider/digitalocean';
import {GCP} from './provider/gcp';
import {Hetzner} from './provider/hetzner';
import {Openstack} from './provider/openstack';
import {Packet} from './provider/packet';
import {Provider} from './provider/provider';
import {VSphere} from './provider/vsphere';

@Injectable()
export class PresetsService {
  // True - enabled, false - disabled
  readonly presetStatusChanges = new EventEmitter<boolean>();
  readonly presetChanges = new EventEmitter<string>();

  private _preset: string;

  constructor(private readonly _http: HttpClient) {}

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.next(preset);
  }

  get preset(): string {
    return this._preset;
  }

  enablePresets(enable: boolean): void {
    this.presetStatusChanges.next(enable);
  }

  provider(provider: NodeProvider.AWS): AWS;
  provider(provider: NodeProvider.AZURE): Azure;
  provider(provider: NodeProvider.DIGITALOCEAN): Digitalocean;
  provider(provider: NodeProvider.GCP): GCP;
  provider(provider: NodeProvider.HETZNER): Hetzner;
  provider(provider: NodeProvider.OPENSTACK): Openstack;
  provider(provider: NodeProvider.PACKET): Packet;
  provider(provider: NodeProvider.VSPHERE): VSphere;
  provider(provider: NodeProvider.ALIBABA): Alibaba;
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
      case NodeProvider.OPENSTACK:
        return new Openstack(this._http, NodeProvider.OPENSTACK);
      case NodeProvider.PACKET:
        return new Packet(this._http, NodeProvider.PACKET);
      case NodeProvider.VSPHERE:
        return new VSphere(this._http, NodeProvider.VSPHERE);
      case NodeProvider.ALIBABA:
        return new Alibaba(this._http, NodeProvider.ALIBABA);
      default:
        throw new Error(`Provider ${provider} not supported.`);
    }
  }

  presets(provider: NodeProvider, datacenter: string): Observable<PresetList> {
    if (!provider || !datacenter) {
      return EMPTY;
    }

    const url = `${environment.restRoot}/providers/${provider}/presets/credentials?datacenter=${datacenter}`;
    return this._http.get<PresetList>(url);
  }
}
