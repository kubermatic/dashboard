import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../../app-config.service';
import {ApiService, ProjectService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeServiceAccountTokens} from '../../testing/fake-data/serviceaccount.fake';
import {RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {ApiMockService} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {ServiceAccountTokenComponent} from './serviceaccount-token.component';

describe('ServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<ServiceAccountTokenComponent>;
  let component: ServiceAccountTokenComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            SharedModule,
          ],
          declarations: [
            ServiceAccountTokenComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ApiService, useClass: ApiMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountTokenComponent);
    component = fixture.componentInstance;
    component.serviceaccountTokens = fakeServiceAccountTokens();
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create service account token cmp', () => {
    expect(component).toBeTruthy();
  });
});
