import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ClusterProviderSettingsData } from '../../../shared/model/ClusterSpecChange';

@Injectable()
export class ClusterService {
  private _providerSettingsData = new Subject<ClusterProviderSettingsData>();
  providerSettingsDataChanges$ = this._providerSettingsData.asObservable();

  changeProviderSettingsData(data: ClusterProviderSettingsData) {
    this._providerSettingsData.next(data);
  }
}
