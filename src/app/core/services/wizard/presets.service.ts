import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {PresetListEntity} from '../../../shared/entity/provider/credentials/PresetListEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';

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
  readonly presetStatusChanges = new ReplaySubject<boolean>();
  readonly presetChanges = new ReplaySubject<string>();

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
      default:
        throw new Error(`Provider ${provider} not supported.`);
    }
  }

  presets(provider: NodeProvider, datacenter: string): Observable<PresetListEntity> {
    const url = `${environment.restRoot}/providers/${provider}/presets/credentials?datacenter=${datacenter}`;
    return this._http.get<PresetListEntity>(url);
  }
}
