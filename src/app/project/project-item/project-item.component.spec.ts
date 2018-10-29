import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';

import { ProjectItemComponent } from './project-item.component';

import { ProjectService, UserService } from '../../core/services';
import { AppConfigService } from '../../app-config.service';

import { SharedModule } from '../../shared/shared.module';
import { RouterStub, RouterTestingModule } from '../../testing/router-stubs';

import { MatDialogRefMock } from '../../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { UserMockService } from '../../testing/services/user-mock.service';
import { AppConfigMockService } from '../../testing/services/app-config-mock.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ProjectItemComponent', () => {
  let fixture: ComponentFixture<ProjectItemComponent>;
  let component: ProjectItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ProjectItemComponent,
      ],
      providers: [
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: Router, useClass: RouterStub },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: AppConfigService, useClass: AppConfigMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectItemComponent);
    component = fixture.componentInstance;
  });

  it('should create project item cmp', () => {
    expect(component).toBeTruthy();
  });
});
