import { ApiService } from './../core/services/api/api.service';
import { DatacenterService } from './../core/services/datacenter/datacenter.service';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ParticlesModule } from 'angular-particle';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRouteStub, RouterStub } from './../testing/router-stubs';
import { AuthMockService } from '../testing/services/auth-mock.service';

import { Auth } from './../core/services/index';
import { DashboardComponent } from './dashboard.component';
import { ApiMockService } from '../testing/services/api-mock.service';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  ParticlesModule,
  SlimLoadingBarModule.forRoot(),
];

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        DashboardComponent
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: Auth, useClass: AuthMockService },
        { provide: ApiService, useClass: ApiMockService },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
