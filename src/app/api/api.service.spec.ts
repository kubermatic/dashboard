/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from "@angular/core/testing";
import { ApiService } from "./api.service";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";

describe("ApiService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
      ],
      declarations: [
      ],
      providers: [
        ApiService,
      ],
    }).compileComponents();
  });


  it("should ...", inject([ApiService], (service: ApiService) => {
    expect(service).toBeTruthy();
  }));
});
