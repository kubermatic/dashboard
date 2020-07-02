import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {AppConfigService} from './app-config.service';
import {CoreModule} from './core/core.module';
import {ApiService, Auth, AuthGuard, DatacenterService, ProjectService, UserService} from './core/services';
import {GoogleAnalyticsService} from './google-analytics.service';
import {KubermaticComponent} from './kubermatic.component';
import {SharedModule} from './shared/shared.module';
import {ApiMockService} from './testing/services/api-mock.service';
import {AppConfigMockService} from './testing/services/app-config-mock.service';
import {AuthMockService} from './testing/services/auth-mock.service';
import {DatacenterMockService} from './testing/services/datacenter-mock.service';
import {ProjectMockService} from './testing/services/project-mock.service';
import {UserMockService} from './testing/services/user-mock.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

const components: any[] = [KubermaticComponent];

describe('KubermaticComponent', () => {
  let fixture: ComponentFixture<KubermaticComponent>;
  let component: KubermaticComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [...components],
      providers: [
        {provide: Auth, useClass: AuthMockService},
        {provide: ApiService, useClass: ApiMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        AuthGuard,
        GoogleAnalyticsService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubermaticComponent);
    component = fixture.componentInstance;
    authService = fixture.debugElement.injector.get(Auth) as any;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should show sidenav', () => {
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).not.toBeNull();
  });

  it('should not show sidenav', () => {
    authService.isAuth = false;
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).toBeNull();
  });
});
