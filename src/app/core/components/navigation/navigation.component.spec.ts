/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {BrowserModule} from "@angular/platform-browser";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../../reducers/index";
import {NavigationComponent} from "./navigation.component";
import {Auth} from "../../services/auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";
import {BreadcrumbsComponent} from "../breadcrumbs/breadcrumbs.component";
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";
import { MaterialModule } from '@angular/material';
import {ConnectionBackend, HttpModule} from "@angular/http";
import {SidenavService} from "../sidenav/sidenav.service";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        SlimLoadingBarModule.forRoot(),
        MaterialModule,
        HttpModule
      ],
      declarations: [
        NavigationComponent,
        BreadcrumbsComponent
      ],
      providers: [
        Auth,
        ConnectionBackend,
        SidenavService
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
