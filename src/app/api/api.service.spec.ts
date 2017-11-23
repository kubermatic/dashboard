/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from "@angular/core/testing";
import { ApiService } from "./api.service";
import {BrowserModule} from "@angular/platform-browser";
import {Http, HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";

describe("ApiService", () => {
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
        ApiService,
        Http,
        ConnectionBackend
      ],
    }).compileComponents();
  });


  it("should ...", inject([ApiService], (service: ApiService) => {
    expect(service).toBeTruthy();
  }));
});
