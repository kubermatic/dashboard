import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';

import {AppConfigService} from '../../../app-config.service';
import {ClusterService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {UserMockService} from '../../../testing/services/user-mock.service';

import {NodeListComponent} from './node-list.component';

class MatDialogMock {
  open() {
    return {afterClosed: () => of([true])};
  }
}

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;
  let clusterService: ClusterService;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NodeListComponent,
          ],
          providers: [
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: MatDialog, useClass: MatDialogMock},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    clusterService = fixture.debugElement.injector.get(ClusterService);
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should call deleteNode', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.projectID = fakeProject().id;
       const event = new MouseEvent('click');

       fixture.detectChanges();
       const spyDeleteClusterNode = spyOn(clusterService, 'deleteNode').and.returnValue(of(null));

       component.deleteNodeDialog(nodeFake(), event);
       tick();

       expect(spyDeleteClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
     }));
});
