/* tslint:disable:no-unused-variable */

import {HttpClientModule} from '@angular/common/http';
import {inject, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {CookieService} from 'ngx-cookie-service';

import {AppConfigService} from '../../../app-config.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';

import {Auth} from './auth.service';

describe('Auth', () => {
  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            HttpClientModule,
            RouterTestingModule,
          ],
          declarations: [],
          providers: [
            Auth,
            CookieService,
            {provide: AppConfigService, useClass: AppConfigMockService},
          ],
        })
        .compileComponents();
  });

  it('should create auth service correctly', inject([Auth], (service: Auth) => {
       expect(service).toBeTruthy();
     }));
});
