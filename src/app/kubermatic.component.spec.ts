import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from './shared/shared.module';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiService, Auth, AUTH_PROVIDERS, AuthGuard, DatacenterService } from './core/services/index';
import { SidenavService } from './core/components/sidenav/sidenav.service';

import { BreadcrumbsComponent } from './core/components/breadcrumbs/breadcrumbs.component';
import { NotificationComponent } from './core/components/notification/notification.component';
import { KubermaticComponent } from './kubermatic.component';
import { SidenavComponent } from './core/components/sidenav/sidenav.component';
import { NavigationComponent } from './core/components/navigation/navigation.component';

import { AuthMockService } from './testing/services/auth-mock.service';
import { DatacenterMockService } from './testing/services/datacenter-mock.service';

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
        ApiService,
        { provide: DatacenterService, useClass: DatacenterMockService },
        AuthGuard,
        SidenavService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubermaticComponent);
    component = fixture.componentInstance;
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
