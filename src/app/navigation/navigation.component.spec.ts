/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {By, BrowserModule} from "@angular/platform-browser";
import { DebugElement } from "@angular/core";

import { NavigationComponent } from "./navigation.component";
import {Auth} from "../auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";
import {GlobalState} from "../global.state";
import {BreadcrumbsComponent} from "../breadcrumbs/breadcrumbs.component";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule
      ],
      declarations: [
        NavigationComponent,
        BreadcrumbsComponent
      ],
      providers: [
        Auth,
        GlobalState
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
