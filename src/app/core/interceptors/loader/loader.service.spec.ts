import {inject, TestBed} from '@angular/core/testing';
import {LoaderInterceptor} from './loader.service';

describe('LoaderInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderInterceptor],
    });
  });

  it('should be created', inject([LoaderInterceptor], (service: LoaderInterceptor) => {
       expect(service).toBeTruthy();
     }));
});
