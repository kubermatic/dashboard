import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

import {environment} from '../../../../environments/environment';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {PresetListEntity} from '../../../shared/entity/provider/credentials/PresetListEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {ClusterDatacenterForm, ClusterProviderForm, ClusterProviderSettingsForm, ClusterSettingsFormView, ClusterSpecForm, MachineNetworkForm, SetMachineNetworksForm} from '../../../shared/model/ClusterForm';
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
export class WizardService {
  // Complete cluster object
  clusterChanges$ = new EventEmitter<ClusterEntity>();
  // Cluster spec - form data
  clusterSpecFormChanges$ = new EventEmitter<ClusterSpecForm>();
  // Machine Networks List - form data
  setMachineNetworksFormChanges$ = new EventEmitter<SetMachineNetworksForm>();
  // Machine Networks - form data
  machineNetworksFormChanges$ = new EventEmitter<MachineNetworkForm[]>();
  // Cluster provider - form data
  private _clusterProviderFormChanges$ = new BehaviorSubject<ClusterProviderForm>({} as ClusterProviderForm);
  // Cluster datacenter - form data
  private _selectedDatacenter: DataCenterEntity;
  clusterDatacenterFormChanges$ = new EventEmitter<ClusterDatacenterForm>();
  // Cluster provider settings - form data
  clusterProviderSettingsFormChanges$ = new EventEmitter<ClusterProviderSettingsForm>();
  // Cluster ssh keys
  clusterSSHKeysChanges$ = new EventEmitter<SSHKeyEntity[]>();
  // Cluster settings form view (hide optional fields or not)
  clusterSettingsFormViewChanged$ = new EventEmitter<ClusterSettingsFormView>();
  // Custom preset selection state
  onCustomPresetSelect = new EventEmitter<string>();
  // Custom presets component state
  onCustomPresetsDisable = new EventEmitter<boolean>();

  constructor(private readonly _http: HttpClient) {}

  get clusterProviderFormChanges$() {
    return this._clusterProviderFormChanges$;
  }

  changeCluster(data: ClusterEntity): void {
    this.clusterChanges$.emit(data);
  }

  changeClusterSpec(data: ClusterSpecForm): void {
    this.clusterSpecFormChanges$.emit(data);
  }

  changeSetMachineNetworks(data: SetMachineNetworksForm): void {
    this.setMachineNetworksFormChanges$.emit(data);
  }

  changeMachineNetwork(data: MachineNetworkForm[]): void {
    this.machineNetworksFormChanges$.emit(data);
  }

  changeClusterProvider(data: ClusterProviderForm): void {
    this.clusterProviderFormChanges$.next(data);
  }

  changeClusterDatacenter(data: ClusterDatacenterForm): void {
    this._selectedDatacenter = data.datacenter;
    this.clusterDatacenterFormChanges$.emit(data);
  }

  changeClusterProviderSettings(data: ClusterProviderSettingsForm): void {
    this.clusterProviderSettingsFormChanges$.emit(data);
  }

  changeClusterSSHKeys(keys: SSHKeyEntity[]): void {
    this.clusterSSHKeysChanges$.emit(keys);
  }

  changeSettingsFormView(data: ClusterSettingsFormView): void {
    this.clusterSettingsFormViewChanged$.emit(data);
  }

  getSelectedDatacenter(): DataCenterEntity {
    return this._selectedDatacenter;
  }

  selectCustomPreset(presetName: string): void {
    this.onCustomPresetSelect.emit(presetName);
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

  presets(provider: NodeProvider): Observable<PresetListEntity> {
    const url = `${environment.restRoot}/providers/${provider}/presets/credentials`;
    return this._http.get<PresetListEntity>(url);
  }
}
