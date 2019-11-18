import {NgReduxTestingModule} from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {SharedModule} from '../../../shared/shared.module';
import {RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {DEFAULT_ADMIN_SETTINGS_MOCK, DEFAULT_USER_SETTINGS_MOCK} from '../../../testing/services/settings-mock.service';

import {SettingsService} from './settings.service';


describe('SettingsService', () => {
  let settingsService: SettingsService;

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
        SettingsService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
    });
    settingsService = TestBed.get(SettingsService);
  });

  it('should be created', () => {
    expect(settingsService).toBeTruthy();
  });

  it('should have up-to-date mocks', () => {
    expect(settingsService.defaultAdminSettings).toEqual(DEFAULT_ADMIN_SETTINGS_MOCK);
    expect(settingsService.defaultUserSettings).toEqual(DEFAULT_USER_SETTINGS_MOCK);
  });
});
