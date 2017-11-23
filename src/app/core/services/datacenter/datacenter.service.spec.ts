import { TestBed, inject } from '@angular/core/testing';

import { DatacenterService } from './datacenter.service';

describe('DatacenterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatacenterService]
    });
  });

  it('should be created', inject([DatacenterService], (service: DatacenterService) => {
    expect(service).toBeTruthy();
  }));
});
