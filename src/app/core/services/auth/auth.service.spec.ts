import {HttpClientModule} from '@angular/common/http';
import {inject, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {CookieService} from 'ngx-cookie-service';

import {AppConfigService} from '../../../app-config.service';
import {COOKIE, COOKIE_DI_TOKEN} from '../../../app.config';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {UserService} from '../index';
import {PreviousRouteService} from '../previous-route/previous-route.service';
import {TokenService} from '../token/token.service';

import {Auth} from './auth.service';

describe('Auth', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, RouterTestingModule],
      declarations: [],
      providers: [
        {provide: COOKIE_DI_TOKEN, useValue: COOKIE},
        UserService,
        TokenService,
        Auth,
        CookieService,
        PreviousRouteService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
    }).compileComponents();
  });

  it('should create auth service correctly', inject([Auth], (service: Auth) => {
    expect(service).toBeTruthy();
  }));
});
