/* tslint:disable:no-unused-variable */

import {HttpClientModule} from '@angular/common/http';
import {inject, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {Auth} from './auth.service';

describe('Auth', () => {
  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            HttpClientModule,
            RouterTestingModule,
          ],
          declarations: [],
          providers: [
            Auth,
          ],
        })
        .compileComponents();
  });

  it('should ...', inject([Auth], (service: Auth) => {
       expect(service).toBeTruthy();
     }));
});
