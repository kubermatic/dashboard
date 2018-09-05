import { ApiService, ProjectService } from '../core/services';
import { ApiMockService } from '../testing/services/api-mock.service';
import { ProjectMockService } from '../testing/services/project-mock.service';
import { SSHKeyComponent } from './sshkey.component';
import { SSHKeyItemComponent } from './sshkey-item/sshkey-item.component';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../testing/router-stubs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterStub } from './../testing/router-stubs';
import { asyncData } from '../testing/services/api-mock.service';
import { MatTabsModule, MatDialog } from '@angular/material';

describe('SSHKeyComponent', () => {
  let fixture: ComponentFixture<SSHKeyComponent>;
  let component: SSHKeyComponent;
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
      ],
      declarations: [
        SSHKeyComponent,
        SSHKeyItemComponent
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useClass: ApiMockService },
        { provide: ProjectService, useClass: ProjectMockService},
        MatDialog,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create sshkey cmp', () => {
    expect(component).toBeTruthy();
  });
});
