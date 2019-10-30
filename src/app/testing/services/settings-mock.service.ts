import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {UserSettings} from '../../shared/entity/MemberEntity';

const DEFAULT_USER_SETTINGS: UserSettings = {
  itemsPerPage: 10,
};

@Injectable()
export class SettingsMockService {
  get userSettings(): Observable<UserSettings> {
    return of(DEFAULT_USER_SETTINGS);
  }

  get defaultUserSettings(): UserSettings {
    return DEFAULT_USER_SETTINGS;
  }
}
