import {async, ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';

import {RBACService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {fakeBindings, fakeClusterBindings, fakeSimpleBindings, fakeSimpleClusterBindings} from '../../../testing/fake-data/rbac.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';

import {RBACComponent} from './rbac.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('RBACComponent', () => {
  let fixture: ComponentFixture<RBACComponent>;
  let component: RBACComponent;

  beforeEach(async(() => {
    const rbacMock = jasmine.createSpyObj(
        'RBACService', ['getClusterBindings', 'getBindings', 'deleteClusterBinding', 'deleteBinding']);
    rbacMock.getClusterBindings.and.returnValue(asyncData([fakeClusterBindings()]));
    rbacMock.getBindings.and.returnValue(asyncData([fakeBindings()]));
    rbacMock.deleteClusterBinding.and.returnValue(of(null));
    rbacMock.deleteBinding.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            RBACComponent,
          ],
          providers: [
            {provide: RBACService, useValue: rbacMock},
            {provide: Router, useClass: RouterStub},
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  });

  it('should create the rbac cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should create simple cluster binding', fakeAsync(() => {
       const simpleClusterBindings = component.createSimpleClusterBinding(fakeClusterBindings());
       expect(simpleClusterBindings).toEqual(fakeSimpleClusterBindings());
     }));

  it('should create simple binding', fakeAsync(() => {
       const simpleBindings = component.createSimpleBinding(fakeBindings());
       expect(simpleBindings).toEqual(fakeSimpleBindings());
     }));
});
