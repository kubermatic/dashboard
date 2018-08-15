import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '../../testing/router-stubs';
import { Auth, ProjectService } from '../../core/services';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import {ProjectSshKeyItemComponent} from './sshkey-item.component';


const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ProjectSshKeyItemComponent', () => {
  let fixture: ComponentFixture<ProjectSshKeyItemComponent>;
  let component: ProjectSshKeyItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ProjectSshKeyItemComponent,
      ],
      providers: [
        ProjectService,
        { provide: Auth, useClass: AuthMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSshKeyItemComponent);
    component = fixture.componentInstance;
  });
});
