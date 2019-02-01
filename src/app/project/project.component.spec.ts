import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {ApiMockService} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';
import {ProjectItemComponent} from './project-item/project-item.component';
import {ProjectComponent} from './project.component';

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;

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
          declarations: [ProjectComponent, ProjectItemComponent],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ApiService, useClass: ApiMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create project cmp', () => {
    expect(component).toBeTruthy();
  });
});
