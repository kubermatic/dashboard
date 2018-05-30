import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ClusterDatacenterForm, ClusterSpecForm, ClusterProviderForm, ClusterProviderSettingsForm, ClusterSettingsFormView } from '../../../shared/model/ClusterForm';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';

@Injectable()
export class WizardService {
  // Complete cluster object
  private _cluster = new Subject<ClusterEntity>();
  clusterChanges$ = this._cluster.asObservable();
  // Cluster spec - form data
  private _clusterSpecForm = new Subject<ClusterSpecForm>();
  clusterSpecFormChanges$ = this._clusterSpecForm.asObservable();
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

  changeCluster(data: ClusterEntity) {
    this._cluster.next(data);
  }

  changeClusterSpec(data: ClusterSpecForm) {
    this._clusterSpecForm.next(data);
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

  changeSettingsFormView(data: ClusterSettingsFormView) {
    this._clusterSettingsFormView.next(data);
  }
}
