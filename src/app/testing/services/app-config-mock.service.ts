import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { fakeAppConfig } from './../fake-data/appConfig.fake';
import { fakeUserGroupConfig } from './../fake-data/userGroupConfig.fake';

@Injectable()
export class AppConfigMockService {

  getConfig() {
    return fakeAppConfig();
  }

  getUserGroupConfig() {
    return fakeUserGroupConfig();
  }
}
