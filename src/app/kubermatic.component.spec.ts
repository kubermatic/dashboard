import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from './shared/shared.module';

import { ApiService, Auth, AUTH_PROVIDERS, AuthGuard, DatacenterService, ProjectService, UserService } from './core/services/index';
import { SidenavService } from './core/components/sidenav/sidenav.service';
import { AppConfigService } from './app-config.service';

import { BreadcrumbsComponent } from './core/components/breadcrumbs/breadcrumbs.component';
import { NotificationComponent } from './core/components/notification/notification.component';
import { KubermaticComponent } from './kubermatic.component';
import { SidenavComponent } from './core/components/sidenav/sidenav.component';
import { NavigationComponent } from './core/components/navigation/navigation.component';

import { ApiMockService } from './testing/services/api-mock.service';
import { AuthMockService } from './testing/services/auth-mock.service';
import { ProjectMockService } from './testing/services/project-mock.service';
import { DatacenterMockService } from './testing/services/datacenter-mock.service';
import { UserMockService } from './testing/services/user-mock.service';
import { GoogleAnalyticsService } from './google-analytics.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  SimpleNotificationsModule,
  RouterTestingModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
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
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ...components
      ],
      providers: [
        AUTH_PROVIDERS,
        { provide: Auth, useClass: AuthMockService },
        { provide: ApiService, useClass: ApiMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: UserService, useClass: UserMockService },
        AuthGuard,
        SidenavService,
        AppConfigService,
        GoogleAnalyticsService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubermaticComponent);
    component = fixture.componentInstance;
    component.config = {
      'show_demo_info': false
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
