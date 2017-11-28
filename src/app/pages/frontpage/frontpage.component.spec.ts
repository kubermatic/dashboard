/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {By, BrowserModule} from "@angular/platform-browser";

import { FrontpageComponent } from "./frontpage.component";
import {RouterTestingModule} from "@angular/router/testing";
import {Auth} from "../../core/services";

describe("FrontpageComponent", () => {
  let component: FrontpageComponent;
  let fixture: ComponentFixture<FrontpageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule,
      ],
      declarations: [
        FrontpageComponent,
      ],
      providers: [
        Auth,
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
