import {HttpClientModule} from '@angular/common/http';
import {inject, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';

import {SharedModule} from '../../../shared/shared.module';
import {CoreModule} from '../../core.module';

import {ErrorNotificationsInterceptor} from './error-notifications.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

describe('ErrorNotificationsInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      providers: [ErrorNotificationsInterceptor],
    });
  });

  it('should be created', inject([ErrorNotificationsInterceptor], (service: ErrorNotificationsInterceptor) => {
       expect(service).toBeTruthy();
     }));
});
