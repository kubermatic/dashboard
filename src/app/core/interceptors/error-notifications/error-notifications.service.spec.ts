import { inject, TestBed } from '@angular/core/testing';

import { ErrorNotificationsInterceptor } from './error-notifications.service';

describe('ErrorNotificationsInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorNotificationsInterceptor],
    });
  });

  it('should be created', inject([ErrorNotificationsInterceptor], (service: ErrorNotificationsInterceptor) => {
    expect(service).toBeTruthy();
  }));
});
