import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AppConfigService } from '../../app-config.service';
import { ProjectService, UserService } from '../../core/services';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '../../testing/router-stubs';
import { AppConfigMockService } from '../../testing/services/app-config-mock.service';
import { MatDialogRefMock } from '../../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { UserMockService } from '../../testing/services/user-mock.service';
import { MemberItemComponent } from './member-item.component';

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
