import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {ClusterDatacenterForm, ClusterProviderForm, ClusterProviderSettingsForm, ClusterSettingsFormView, ClusterSpecForm, MachineNetworkForm, SetMachineNetworksForm} from '../../../shared/model/ClusterForm';

@Injectable()
export class WizardService {
  // Complete cluster object
  private _cluster = new Subject<ClusterEntity>();
  clusterChanges$ = this._cluster.asObservable();
  // Cluster spec - form data
  private _clusterSpecForm = new Subject<ClusterSpecForm>();
  clusterSpecFormChanges$ = this._clusterSpecForm.asObservable();
  // Machine Networks List - form data
  private _setMachineNetworksForm = new Subject<SetMachineNetworksForm>();
  setMachineNetworksFormChanges$ = this._setMachineNetworksForm.asObservable();
  // Machine Networks - form data
  private _machineNetworksForm = new Subject<MachineNetworkForm[]>();
  machineNetworksFormChanges$ = this._machineNetworksForm.asObservable();
  // Cluster provider - form data
  private _clusterProviderForm = new Subject<ClusterProviderForm>();
  clusterProviderFormChanges$ = this._clusterProviderForm.asObservable();
  // Cluster datacenter - form data
  private _clusterDatacenterForm = new Subject<ClusterDatacenterForm>();
  clusterDatacenterFormChanges$ = this._clusterDatacenterForm.asObservable();
  // Cluster provider settings - form data
  private _clusterProviderSettingsForm = new Subject<ClusterProviderSettingsForm>();
  clusterProviderSettingsFormChanges$ = this._clusterProviderSettingsForm.asObservable();
  // Cluster ssh keys
  private _clusterSSHKeys = new Subject<SSHKeyEntity[]>();
  clusterSSHKeysChanges$ = this._clusterSSHKeys.asObservable();
  // Cluster settings form view (hide optional fields or not)
  private _clusterSettingsFormView = new Subject<ClusterSettingsFormView>();
  clusterSettingsFormViewChanged$ = this._clusterSettingsFormView.asObservable();

  changeCluster(data: ClusterEntity): void {
    this._cluster.next(data);
  }

  changeClusterSpec(data: ClusterSpecForm): void {
    this._clusterSpecForm.next(data);
  }

  changeSetMachineNetworks(data: SetMachineNetworksForm): void {
    this._setMachineNetworksForm.next(data);
  }

  changeMachineNetwork(data: MachineNetworkForm[]): void {
    this._machineNetworksForm.next(data);
  }

  changeClusterProvider(data: ClusterProviderForm): void {
    this._clusterProviderForm.next(data);
  }

  changeClusterDatacenter(data: ClusterDatacenterForm): void {
    this._clusterDatacenterForm.next(data);
  }

  changeClusterProviderSettings(data: ClusterProviderSettingsForm): void {
    this._clusterProviderSettingsForm.next(data);
  }

  changeClusterSSHKeys(keys: SSHKeyEntity[]): void {
    this._clusterSSHKeys.next(keys);
  }

  changeSettingsFormView(data: ClusterSettingsFormView): void {
    this._clusterSettingsFormView.next(data);
  }
}
