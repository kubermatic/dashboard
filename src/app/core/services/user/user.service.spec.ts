import {NgReduxTestingModule} from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeUserGroupConfig} from '../../../testing/fake-data/userGroupConfig.fake';
import {RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {Auth} from '../auth/auth.service';

import {UserService} from './user.service';


describe('Service: UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        NgReduxTestingModule,
        SharedModule,
      ],
      providers: [
        UserService,
        {provide: Auth, useClass: AuthMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
    });
    userService = TestBed.get(UserService);
  });

  it('should be created', () => {
    expect(userService).toBeTruthy();
  });

  it('should get user user group', () => {
    expect(userService.userGroupConfig('owners')).toEqual(fakeUserGroupConfig().owners);
  });
});
