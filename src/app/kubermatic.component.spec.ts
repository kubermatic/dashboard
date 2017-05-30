/* tslint:disable:no-unused-variable */
import {TestBed, async} from "@angular/core/testing";
import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
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
        SlimLoadingBarModule.forRoot()
      ],
      declarations: [
        KubermaticComponent,
        NavigationComponent,
        NotificationComponent,
        FrontpageComponent,
        BreadcrumbsComponent
      ],
      providers: [
        AUTH_PROVIDERS,
        Auth,
        ApiService,
        AuthGuard,
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
