import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {ClusterService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeAWSFake, nodeFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';

import {NodeListComponent} from './node-list.component';

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
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
            {provide: MatDialog, useClass: MatDialogMock},
            {provide: SettingsService, useClass: SettingsMockService},
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
       const spyDeleteClusterNode = jest.spyOn(clusterService, 'deleteNode').mockReturnValue(of(null));

       component.deleteNodeDialog(nodeFake(), event);
       tick();

       expect(spyDeleteClusterNode).toHaveBeenCalledTimes(1);
     }));

  it('should get operating system name', () => {
    expect(component.getSystem(nodeFake())).toBe('Ubuntu');
  });

  it('should get info text for name', () => {
    expect(component.getInfo(nodeFake())).toBe('kubermatic-tbbfvttvs-v5hmk');
  });

  it('should get info text for aws name', () => {
    expect(component.getInfo(nodeAWSFake())).toBe('ip-172-31-1-240.eu-central-1.compute.internal');
  });

  it('should get node name', () => {
    expect(component.getNodeName(nodeFake())).toBe('kubermatic-tbbfvttvs-v5hmk');
  });

  it('should display tags', () => {
    const tags = {test: 'test', tag: 'tag'};
    expect(component.displayTags(tags)).toBeTruthy();
  });

  it('should not display tags', () => {
    const tags = {};
    expect(component.displayTags(tags)).toBeFalsy();
  });
});
