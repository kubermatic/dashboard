/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from "@angular/core/testing";
import { ApiService } from "./api.service";
import {BrowserModule} from "@angular/platform-browser";
import {Http, HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";

describe("ApiService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule
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
