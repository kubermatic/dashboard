/* tslint:disable:no-unused-variable */

import { TestBed, async } from "@angular/core/testing";
import { KubermaticComponent } from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {RouterModule} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from "@angular/platform-browser-dynamic/testing";
import {AUTH_PROVIDERS} from "angular2-jwt";
import {Auth} from "./auth/auth.service";
import {ApiService} from "./api/api.service";
import {AuthGuard} from "./auth/auth.guard";
import {GlobalState} from "./global.state";

describe("KubermaticComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [
        KubermaticComponent,
        NavigationComponent,
        FrontpageComponent,
        BreadcrumbsComponent
      ],
      providers: [
        AUTH_PROVIDERS,
        Auth,
        ApiService,
        AuthGuard,
        GlobalState
      ],
    }).compileComponents();
  });

  it("should create the Kubermatic", async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have a footer with Loodse branding`, async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector(".al-copy a").textContent).toContain("Loodse");
  }));
});
