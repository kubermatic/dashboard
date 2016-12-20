/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {By, BrowserModule} from "@angular/platform-browser";
import { DebugElement } from "@angular/core";

import { FrontpageComponent } from "./frontpage.component";
import {RouterTestingModule} from "@angular/router/testing";
import {Auth} from "../auth/auth.service";
import {GlobalState} from "../global.state";

describe("FrontpageComponent", () => {
  let component: FrontpageComponent;
  let fixture: ComponentFixture<FrontpageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule
      ],
      declarations: [
        FrontpageComponent,
      ],
      providers: [
        Auth,
        GlobalState
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrontpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
