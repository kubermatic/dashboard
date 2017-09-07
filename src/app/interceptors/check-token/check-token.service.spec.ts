import { TestBed, inject } from '@angular/core/testing';

import { CheckTokenInterceptor } from './check-token.service';

describe('CheckTokenService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CheckTokenInterceptor]
    });
  });

  it('should be created', inject([CheckTokenInterceptor], (service: CheckTokenInterceptor) => {
    expect(service).toBeTruthy();
  }));
});
