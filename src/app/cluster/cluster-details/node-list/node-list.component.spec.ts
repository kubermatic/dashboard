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
import {nodeFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
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
  let apiService: ApiService;

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
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should call deleteClusterNode', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.projectID = fakeProject().id;

       fixture.detectChanges();
       const spyDeleteClusterNode = spyOn(apiService, 'deleteClusterNode').and.returnValue(of(null));

       component.deleteNodeDialog(nodeFake());
       tick();

       expect(spyDeleteClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
     }));
});
