import {NgReduxTestingModule} from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef, MatTabsModule} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {ApiService, ProjectService} from '../../../core/services';
import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {AWSNodeDataComponent} from '../../../node-data/aws-node-data/aws-node-data.component';
import {AzureNodeDataComponent} from '../../../node-data/azure-node-data/azure-node-data.component';
import {DigitaloceanNodeDataComponent} from '../../../node-data/digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanOptionsComponent} from '../../../node-data/digitalocean-node-data/digitalocean-options/digitalocean-options.component';

import Spy = jasmine.Spy;
import {HetznerNodeDataComponent} from '../../../node-data/hetzner-node-data/hetzner-node-data.component';
import {NodeDataComponent} from '../../../node-data/node-data.component';
import {OpenstackNodeDataComponent} from '../../../node-data/openstack-node-data/openstack-node-data.component';
import {OpenstackOptionsComponent} from '../../../node-data/openstack-node-data/openstack-options/openstack-options.component';
import {VSphereNodeDataComponent} from '../../../node-data/vsphere-add-node/vsphere-node-data.component';
import {VSphereOptionsComponent} from '../../../node-data/vsphere-add-node/vsphere-options/vsphere-options.component';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanSizes} from '../../../testing/fake-data/addNodeModal.fake';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeDigitaloceanCreateNode, nodeDataFake} from '../../../testing/fake-data/node.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {NodeDataModalComponent} from './node-data-modal.component';
import {NodeService} from '../../../core/services/node/node.service';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';

describe('AddNodesModalComponent', () => {
  let fixture: ComponentFixture<NodeDataModalComponent>;
  let component: NodeDataModalComponent;
  let activatedRoute: ActivatedRouteStub;
  let createNodesSpy: Spy;
  let nodeDepPatchSpy: Spy;

  beforeEach(async(() => {
    const apiMock =
        jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'createClusterNode', 'patchNodeDeployment']);
    apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    nodeDepPatchSpy = apiMock.patchNodeDeployment.and.returnValue(asyncData(({
      spec: {
        replicas: 1,
        template: fakeDigitaloceanCreateNode().spec,
      }
    } as NodeDeploymentEntity)));

    const nodeMock = jasmine.createSpyObj('NodeService', ['createNodeDeployment']);
    createNodesSpy = nodeMock.createNodeDeployment.and.returnValue(asyncData(fakeDigitaloceanCreateNode()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            HttpClientModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            NgReduxTestingModule,
            SharedModule,
            MatTabsModule,
          ],
          declarations: [
            NodeDataModalComponent,
            NodeDataComponent,
            OpenstackNodeDataComponent,
            OpenstackOptionsComponent,
            AWSNodeDataComponent,
            DigitaloceanNodeDataComponent,
            DigitaloceanOptionsComponent,
            HetznerNodeDataComponent,
            VSphereNodeDataComponent,
            VSphereOptionsComponent,
            AzureNodeDataComponent,
          ],
          providers: [
            {provide: MAT_DIALOG_DATA, useValue: {cluster: fakeDigitaloceanCluster()}},
            {provide: MatDialogRef, useValue: {}},
            {provide: ApiService, useValue: apiMock},
            {provide: ActivatedRoute, useClass: ActivatedRouteStub},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: NodeService, useValue: nodeMock},
            {provide: Router, useClass: RouterStub},
            NodeDataService,
            WizardService,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDataModalComponent);
    component = fixture.componentInstance;
    component.data.cluster = fakeDigitaloceanCluster();
    component.data.datacenter = fakeDigitaloceanDatacenter();
    component.data.nodeData = {
      spec: fakeDigitaloceanCreateNode().spec,
      count: 1,
      valid: true,
    };
    component.data.nodeData = nodeDataFake();
    component.data.editMode = false;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: 'tbbfvttvs'};
    fixture.debugElement.injector.get(ApiService);
    fixture.detectChanges();
  });

  it('should create the add node modal cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should call createNodeDeployment method from the NodeService if not in edit mode', fakeAsync(() => {
       component.performAction();
       tick();
       expect(createNodesSpy.and.callThrough()).toHaveBeenCalled();
     }));

  it('should call patchNodeDeployment method from the ApiService if in edit mode', fakeAsync(() => {
       component.data.editMode = true;
       component.data.nodeDeployment = {
         id: 'test',
         spec: {
           replicas: 1,
           template: fakeDigitaloceanCreateNode().spec,
         },
       };
       component.performAction();
       tick();
       expect(nodeDepPatchSpy.and.callThrough()).toHaveBeenCalled();
     }));

  it('should render mat-dialog-actions', () => {
    const actions = fixture.debugElement.query(By.css('.mat-dialog-actions'));
    expect(actions).not.toBeNull();
  });
});
