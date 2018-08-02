import { MatTabsModule, MatDialog } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectComponent } from './project.component';
import { ProjectItemComponent } from './project-item/project-item.component';
import { Router } from '@angular/router';
import { MemberModule } from '../member/member.module';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { RouterStub, RouterTestingModule } from './../testing/router-stubs';

import { ApiService, ProjectService, UserService } from '../core/services';
import { AppConfigService } from '../app-config.service';

import { ApiMockService } from '../testing/services/api-mock.service';
import { ProjectMockService } from '../testing/services/project-mock.service';
import { UserMockService } from '../testing/services/user-mock.service';
import { AppConfigMockService } from '../testing/services/app-config-mock.service';
import { asyncData } from '../testing/services/api-mock.service';

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        MatTabsModule,
        MemberModule
      ],
      declarations: [
        ProjectComponent,
        ProjectItemComponent
        ProjectSshKeyItemComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useClass: ApiMockService },
        { provide: ProjectService, useClass: ProjectMockService},
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService },
        MatDialog
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create project cmp', () => {
    expect(component).toBeTruthy();
  });
});
