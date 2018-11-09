import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatTabsModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AppConfigService } from '../app-config.service';
import { ApiService, UserService } from '../core/services';
import { SharedModule } from '../shared/shared.module';
import { ActivatedRouteStub, RouterStub, RouterTestingModule } from '../testing/router-stubs';
import { ApiMockService } from '../testing/services/api-mock.service';
import { AppConfigMockService } from '../testing/services/app-config-mock.service';
import { UserMockService } from '../testing/services/user-mock.service';
import { SSHKeyItemComponent } from './sshkey-item/sshkey-item.component';
import { SSHKeyComponent } from './sshkey.component';

describe('SSHKeyComponent', () => {
  let fixture: ComponentFixture<SSHKeyComponent>;
  let component: SSHKeyComponent;
  let activatedRoute: ActivatedRouteStub;

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
        SSHKeyComponent,
        SSHKeyItemComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useClass: ApiMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        MatDialog,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = { projectID: '4k6txp5sq' };

    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create sshkey cmp', () => {
    expect(component).toBeTruthy();
  });
});
