/* tslint:disable:no-unused-variable */
import {TestBed, async} from "@angular/core/testing";
import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./core/components/navigation/navigation.component";
import {FrontpageComponent} from "./pages/frontpage/frontpage.component";
import {BreadcrumbsComponent} from "./core/components/breadcrumbs/breadcrumbs.component";
import {BrowserModule} from "@angular/platform-browser";
import {Http, HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {AUTH_PROVIDERS, Auth, AuthGuard} from "./core/services";
import {ApiService} from "app/core/services/api/api.service";
import {SimpleNotificationsModule} from "angular2-notifications";
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";
import { SidenavComponent } from './core/components/sidenav/sidenav.component';
import { SidenavService} from './core/components/sidenav/sidenav.service';
import {NodeDeleteConfirmationService} from "./cluster/node-delete-confirmation/node-delete-confirmation.service";

describe("KubermaticComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule,
        //SimpleNotificationsModule.forRoot(),
        SimpleNotificationsModule,
        SlimLoadingBarModule.forRoot()
      ],
      declarations: [
        KubermaticComponent,
        NavigationComponent,
        FrontpageComponent,
        BreadcrumbsComponent,
        SidenavComponent,

      ],
      providers: [
        AUTH_PROVIDERS,
        Auth,
        ApiService,
        AuthGuard,
        SidenavService,
        NodeDeleteConfirmationService,
        Http
      ],
    }).compileComponents();
  });

  it("should create the Kubermatic", async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
