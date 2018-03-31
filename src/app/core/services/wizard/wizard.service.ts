import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ClusterDatacenterForm, ClusterNameForm, ClusterProviderForm, ClusterProviderSettingsForm } from '../../../shared/model/ClusterForm';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';

@Injectable()
export class WizardService {
  // Complete cluster object
  private _cluster = new Subject<ClusterEntity>();
  clusterChanges$ = this._cluster.asObservable();
  // Cluster name - form data
  private _clusterNameForm = new Subject<ClusterNameForm>();
  clusterNameFormChanges$ = this._clusterNameForm.asObservable();
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

  changeCluster(data: ClusterEntity) {
    this._cluster.next(data);
  }

  changeClusterName(data: ClusterNameForm) {
    this._clusterNameForm.next(data);
  }

  changeClusterProvider(data: ClusterProviderForm) {
    this._clusterProviderForm.next(data);
  }

  changeClusterDatacenter(data: ClusterDatacenterForm) {
    this._clusterDatacenterForm.next(data);
  }

  changeClusterProviderSettings(data: ClusterProviderSettingsForm) {
    this._clusterProviderSettingsForm.next(data);
  }

  changeClusterSSHKeys(keys: SSHKeyEntity[]) {
    this._clusterSSHKeys.next(keys);
  }
}
