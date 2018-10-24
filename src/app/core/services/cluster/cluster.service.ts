import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CloudSpecPatch } from '../../../shared/entity/ClusterEntityPatch';

export class ProviderSettingsPatch {
  cloudSpecPatch: CloudSpecPatch;
  isValid: boolean;
}

@Injectable()
export class ClusterService {
  private _providerSettingsPatch = new Subject<ProviderSettingsPatch>();
  providerSettingsPatchChanges$ = this._providerSettingsPatch.asObservable();

  changeProviderSettingsPatch(patch: ProviderSettingsPatch) {
    this._providerSettingsPatch.next(patch);
  }
}
