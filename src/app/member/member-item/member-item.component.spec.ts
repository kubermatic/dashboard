import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MemberItemComponent } from './member-item.component';
import { ProjectService, UserService } from '../../core/services';
import { AppConfigService } from '../../app-config.service';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '../../testing/router-stubs';
import { UserMockService } from '../../testing/services/user-mock.service';
import { AppConfigMockService } from '../../testing/services/app-config-mock.service';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { MatDialogRefMock } from '../../testing/services/mat-dialog-ref-mock';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('MemberItemComponent', () => {
  let fixture: ComponentFixture<MemberItemComponent>;
  let component: MemberItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        MemberItemComponent,
      ],
      providers: [
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService}
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberItemComponent);
    component = fixture.componentInstance;
  });

  it('should create member item cmp', () => {
    expect(component).toBeTruthy();
  });
});
