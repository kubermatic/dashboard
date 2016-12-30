/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from "@angular/core/testing";
import { ApiService } from "./api.service";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {Auth} from "../auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";
import {GlobalState} from "../global.state";

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
        GlobalState
      ],
    }).compileComponents();
  });


  it("should ...", inject([ApiService], (service: ApiService) => {
    expect(service).toBeTruthy();
  }));
});
