import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';
import Spy = jasmine.Spy;

import {ApiService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {ChangeClusterVersionComponent} from './change-cluster-version.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('ChangeClusterVersionComponent', () => {
  let fixture: ComponentFixture<ChangeClusterVersionComponent>;
  let component: ChangeClusterVersionComponent;
  let patchClusterSpy: Spy;
  let upgradeClusterNodeDeploymentsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['patchCluster', 'upgradeClusterNodeDeployments']);
    patchClusterSpy = apiMock.patchCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    upgradeClusterNodeDeploymentsSpy = apiMock.upgradeClusterNodeDeployments.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ChangeClusterVersionComponent,
          ],
          providers: [
            {provide: MAT_DIALOG_DATA, useValue: {clusterName: 'clustername'}},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ChangeClusterVersionComponent);
    component = fixture.componentInstance;
  }));

  it('should create the change cluster version component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should call patchCluster method from api', fakeAsync(() => {
       component.selectedVersion = 'new version';
       // copy object here since this test modifies the global fake cluster object which impacts other tests otherwise
       component.cluster = JSON.parse(JSON.stringify(fakeDigitaloceanCluster()));
       component.datacenter = fakeDigitaloceanDatacenter();
       component.controlPlaneVersions = ['1.9.5'];

       fixture.detectChanges();
       component.changeVersion();
       tick();
       expect(patchClusterSpy.and.callThrough()).toHaveBeenCalledTimes(1);
     }));

  it('should call upgradeClusterNodeDeployments method', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.selectedVersion = 'new-version';
       component.project = fakeProject();

       fixture.detectChanges();
       component.upgradeNodeDeployments();
       tick();

       expect(upgradeClusterNodeDeploymentsSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
