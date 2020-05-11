import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {NotificationService, RBACService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {
  fakeSimpleBindings,
  fakeSimpleClusterBindings,
} from '../../../testing/fake-data/rbac.fake';
import {RouterStub} from '../../../testing/router-stubs';

import {RBACComponent} from './rbac.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('RBACComponent', () => {
  let fixture: ComponentFixture<RBACComponent>;
  let component: RBACComponent;

  beforeEach(async(() => {
    const rbacMock = {
      deleteClusterBinding: jest.fn(),
      deleteBinding: jest.fn(),
    };
    rbacMock.deleteClusterBinding.mockReturnValue(of(null));
    rbacMock.deleteBinding.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [RBACComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: Router, useClass: RouterStub},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;
    component.clusterBindings = fakeSimpleClusterBindings();
    component.bindings = fakeSimpleBindings();
    fixture.detectChanges();
  });

  it('should create the rbac cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
