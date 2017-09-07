import { TestBed, inject } from '@angular/core/testing';

import { CustomEventService } from './custom-event.service';

describe('CustomEventService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomEventService]
    });
  });

  it('should be created', inject([CustomEventService], (service: CustomEventService) => {
    expect(service).toBeTruthy();
  }));
});
