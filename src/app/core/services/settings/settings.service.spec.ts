import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {Auth} from '..';
import {AppConfigService} from '../../../app-config.service';
import {SharedModule} from '../../../shared/shared.module';
import {RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';

import {SettingsService} from './settings.service';


describe('SettingsService', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        SharedModule,
      ],
      providers: [
        SettingsService,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Auth, useClass: AuthMockService},
      ],
    });
    settingsService = TestBed.get(SettingsService);
  });

  it('should be created', () => {
    expect(settingsService).toBeTruthy();
  });
});
