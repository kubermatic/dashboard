import {NgReduxTestingModule} from '@angular-redux/store/testing';
import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {SimpleNotificationsModule} from 'angular2-notifications';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from './app-config.service';
import {BreadcrumbsComponent} from './core/components/breadcrumbs/breadcrumbs.component';
import {NavigationComponent} from './core/components/navigation/navigation.component';
import {NotificationComponent} from './core/components/notification/notification.component';
import {SidenavComponent} from './core/components/sidenav/sidenav.component';
import {SidenavService} from './core/components/sidenav/sidenav.service';
import {ApiService, Auth, AuthGuard, DatacenterService, ProjectService, UserService} from './core/services/index';
import {GoogleAnalyticsService} from './google-analytics.service';
import {KubermaticComponent} from './kubermatic.component';
import {SharedModule} from './shared/shared.module';
import {ApiMockService} from './testing/services/api-mock.service';
import {AuthMockService} from './testing/services/auth-mock.service';
import {DatacenterMockService} from './testing/services/datacenter-mock.service';
import {ProjectMockService} from './testing/services/project-mock.service';
import {UserMockService} from './testing/services/user-mock.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  SimpleNotificationsModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

const components: any[] = [
  KubermaticComponent,
  NavigationComponent,
  BreadcrumbsComponent,
  NotificationComponent,
  SidenavComponent,
];

describe('KubermaticComponent', () => {
  let fixture: ComponentFixture<KubermaticComponent>;
  let component: KubermaticComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ...components,
          ],
          providers: [
            {provide: Auth, useClass: AuthMockService},
            {provide: ApiService, useClass: ApiMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: UserService, useClass: UserMockService},
            AuthGuard,
            SidenavService,
            AppConfigService,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubermaticComponent);
    component = fixture.componentInstance;
    component.config = {
      show_demo_info: false,
      show_terms_of_service: false,
    };
    authService = fixture.debugElement.injector.get(Auth) as any;
  });

  it('should create the Kubermatic', () => {
    expect(component).toBeTruthy();
  });

  it('should show sidenav', () => {
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).not.toBeNull('sidenav should not be rendered');
  });

  it('should not show sidenav', () => {
    authService.isAuth = false;
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).toBeNull('sidenav should not be rendered');
  });
});
