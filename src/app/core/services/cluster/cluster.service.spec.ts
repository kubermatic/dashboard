import { TestBed, inject } from '@angular/core/testing';

import { ClusterService } from './cluster.service';

describe('ClusterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterService]
    });
  });

  it('should be created', inject([ClusterService], (service: ClusterService) => {
    expect(service).toBeTruthy();
  }));
});
