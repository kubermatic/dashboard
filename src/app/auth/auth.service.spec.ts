/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from "@angular/core/testing";
import { Auth } from "./auth.service";
import {HttpModule} from "@angular/http";
import {BrowserModule} from "@angular/platform-browser";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";

describe("Auth", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer)
      ],
      declarations: [
      ],
      providers: [
        Auth,
      ],
    }).compileComponents();
  });


  it("should ...", inject([Auth], (service: Auth) => {
    expect(service).toBeTruthy();
  }));
});
