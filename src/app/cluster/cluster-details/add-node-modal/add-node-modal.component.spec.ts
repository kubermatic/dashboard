import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteStub, RouterTestingModule } from './../../../testing/router-stubs';
import { ApiService } from '../../../core/services/api/api.service';
import { asyncData } from '../../../testing/services/api-mock.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AddNodeModalComponent } from './add-node-modal.component';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { AddNodeComponent } from '../../../add-node/add-node.component';
import { OpenstackAddNodeComponent } from '../../../add-node/openstack-add-node/openstack-add-node.component';
import { DigitaloceanAddNodeComponent } from '../../../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from '../../../add-node/digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { AwsAddNodeComponent } from '../../../add-node/aws-add-node/aws-add-node.component';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import {fakeDigitaloceanCreateNode, nodeDataFake} from '../../../testing/fake-data/node.fake';
import { fakeDigitaloceanSizes } from '../../../testing/fake-data/addNodeModal.fake';
import Spy = jasmine.Spy;
import { HetznerAddNodeComponent } from '../../../add-node/hetzner-add-node/hetzner-add-node.component';
import { VSphereAddNodeComponent } from '../../../add-node/vsphere-add-node/vsphere-add-node.component';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';

describe('AddNodeModalComponent', () => {
  let fixture: ComponentFixture<AddNodeModalComponent>;
  let component: AddNodeModalComponent;
  let apiService: ApiService;
  let activatedRoute: ActivatedRouteStub;
  let getDigitaloceanSizesSpy: Spy;
  let createClusterNodeSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'createClusterNode']);
    getDigitaloceanSizesSpy = apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes));
    createClusterNodeSpy = apiMock.createClusterNode.and.returnValue(asyncData(fakeDigitaloceanCreateNode));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        NgReduxTestingModule,
        SharedModule,
      ],
      declarations: [
        AddNodeModalComponent,
        AddNodeComponent,
        OpenstackAddNodeComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        DigitaloceanOptionsComponent,
        HetznerAddNodeComponent,
        VSphereAddNodeComponent,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { cluster: fakeDigitaloceanCluster } },
        { provide: MatDialogRef, useValue: {} },
        { provide: ApiService, useValue: apiMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: DatacenterService, useClass: DatacenterMockService },
        AddNodeService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeModalComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster;
    component.datacenter = fakeDigitaloceanDatacenter;
    component.addNodeData = {
      node: fakeDigitaloceanCreateNode,
      count: 1,
      valid: true
    };
    component.addNodeData = nodeDataFake;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = { clusterName: 'tbbfvttvs' };
    apiService = fixture.debugElement.injector.get(ApiService);
    fixture.detectChanges();
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call createClusterNode method from the api', fakeAsync(() => {
    component.addNode();
    tick();

    expect(createClusterNodeSpy.and.callThrough()).toHaveBeenCalled();
  }));

  it('should render mat-dialog-actions', () => {
    const actions = fixture.debugElement.query(By.css('.mat-dialog-actions'));
    expect(actions).not.toBeNull();
  });
});
