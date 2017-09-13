import { TestBed, inject } from '@angular/core/testing';

import { CreateNodesService } from './create-nodes.service';

describe('CreateNodesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreateNodesService]
    });
  });

  it('should be created', inject([CreateNodesService], (service: CreateNodesService) => {
    expect(service).toBeTruthy();
  }));
});
