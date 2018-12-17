import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeDeploymentsFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';

import {NodeDeploymentListComponent} from './node-deployment-list.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

class MatDialogMock {
  open() {
    return {afterClosed: () => of([true])};
  }
}

describe('NodeDeploymentListComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentListComponent>;
  let component: NodeDeploymentListComponent;
  let apiService: ApiService;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NodeDeploymentListComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: MatDialog, useClass: MatDialogMock},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeploymentListComponent);
    component = fixture.componentInstance;
    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should return correct CSS classes', () => {
    const green = 'fa fa-circle green';
    const orange = 'fa fa-spin fa-circle-o-notch orange';

    const nds = nodeDeploymentsFake();

    component.cluster = fakeDigitaloceanCluster();

    expect(component.getHealthStatus(nds[0], 0))
        .toEqual(
            {
              color: green,
              status: 'Running',
              class: 'statusRunning',
            },
            'should return classes for green icon');
    expect(component.getHealthStatus(nds[1], 0))
        .toEqual(
            {
              color: orange,
              status: 'Pending',
              class: 'statusWaiting',
            },
            'should return classes for orange icon');
  });

  it('should call deleteClusterNodeDeployment', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.projectID = fakeProject().id;

       fixture.detectChanges();
       const spyDeleteClusterNode = spyOn(apiService, 'deleteNodeDeployment').and.returnValue(of(null));

       component.showDeleteDialog(nodeDeploymentsFake()[0]);
       tick();

       expect(spyDeleteClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
     }));
});
