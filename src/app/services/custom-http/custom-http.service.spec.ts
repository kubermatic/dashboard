import { TestBed, inject } from '@angular/core/testing';

import { CustomHttpService } from './custom-http.service';

describe('CustomHttpService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomHttpService]
    });
  });

  it('should be created', inject([CustomHttpService], (service: CustomHttpService) => {
    expect(service).toBeTruthy();
  }));
});
