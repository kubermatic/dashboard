/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {By, BrowserModule} from "@angular/platform-browser";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";

import { FrontpageComponent } from "./frontpage.component";
import {RouterTestingModule} from "@angular/router/testing";
import {Auth} from "../auth/auth.service";

describe("FrontpageComponent", () => {
  let component: FrontpageComponent;
  let fixture: ComponentFixture<FrontpageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer)
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
