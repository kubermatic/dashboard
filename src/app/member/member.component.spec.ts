import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatTabsModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AppConfigService } from '../app-config.service';
import { ApiService, ProjectService, UserService } from '../core/services';
import { SharedModule } from '../shared/shared.module';
import { RouterTestingModule } from '../testing/router-stubs';
import { ApiMockService } from '../testing/services/api-mock.service';
import { AppConfigMockService } from '../testing/services/app-config-mock.service';
import { ProjectMockService } from '../testing/services/project-mock.service';
import { UserMockService } from '../testing/services/user-mock.service';
import { RouterStub } from './../testing/router-stubs';
import { MemberItemComponent } from './member-item/member-item.component';
import { MemberComponent } from './member.component';

describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let component: MemberComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        MatTabsModule,
      ],
      declarations: [
        MemberComponent,
        MemberItemComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useClass: ApiMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService},
        MatDialog,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create members cmp', () => {
    expect(component).toBeTruthy();
  });
});
