/* tslint:disable:no-unused-variable */
import {TestBed, async} from "@angular/core/testing";
import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {BrowserModule} from "@angular/platform-browser";
import {Http, HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {AUTH_PROVIDERS} from "./auth/auth.provider";
import {Auth} from "./auth/auth.service";
import {ApiService} from "./api/api.service";
import {AuthGuard} from "./auth/auth.guard";
import {combinedReducer} from "./reducers/index";
import {StoreModule} from "@ngrx/store";
import {NotificationComponent} from "./notification/notification.component";
import {SimpleNotificationsModule} from "angular2-notifications";
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";
import { MaterialModule } from '@angular/material';
import { SidenavComponent } from './sidenav/sidenav.component';
import { SidenavService} from './sidenav/sidenav.service';
import {NodeDeleteConfirmationService} from "./cluster/node-delete-confirmation/node-delete-confirmation.service";

describe("KubermaticComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        //SimpleNotificationsModule.forRoot(),
        SimpleNotificationsModule,
        SlimLoadingBarModule.forRoot(),
        MaterialModule
      ],
      declarations: [
        KubermaticComponent,
        NavigationComponent,
        NotificationComponent,
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
