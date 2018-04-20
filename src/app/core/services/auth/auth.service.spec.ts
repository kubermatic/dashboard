/* tslint:disable:no-unused-variable */

import { inject, TestBed } from '@angular/core/testing';
import { Auth } from './auth.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

describe('Auth', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [],
      providers: [
        Auth,
      ],
    }).compileComponents();
  });

  it('should ...', inject([Auth], (service: Auth) => {
    expect(service).toBeTruthy();
  }));
});
