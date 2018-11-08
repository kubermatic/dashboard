import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatTabsModule } from '@angular/material';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AddNodeComponent } from '../../../add-node/add-node.component';
import { AwsAddNodeComponent } from '../../../add-node/aws-add-node/aws-add-node.component';
import { AzureAddNodeComponent } from '../../../add-node/azure-add-node/azure-add-node.component';
import { DigitaloceanAddNodeComponent } from '../../../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from '../../../add-node/digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import Spy = jasmine.Spy;
import { HetznerAddNodeComponent } from '../../../add-node/hetzner-add-node/hetzner-add-node.component';
import { OpenstackAddNodeComponent } from '../../../add-node/openstack-add-node/openstack-add-node.component';
import { OpenstackOptionsComponent } from '../../../add-node/openstack-add-node/openstack-options/openstack-options.component';
import { VSphereAddNodeComponent } from '../../../add-node/vsphere-add-node/vsphere-add-node.component';
import { VSphereOptionsComponent } from '../../../add-node/vsphere-add-node/vsphere-options/vsphere-options.component';
import { ApiService, ProjectService } from '../../../core/services';
import { AddNodeService } from '../../../core/services/add-node/add-node.service';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { SharedModule } from '../../../shared/shared.module';
import { fakeDigitaloceanSizes } from '../../../testing/fake-data/addNodeModal.fake';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeDigitaloceanCreateNode, nodeDataFake } from '../../../testing/fake-data/node.fake';
import { ActivatedRouteStub, RouterTestingModule } from '../../../testing/router-stubs';
import { asyncData } from '../../../testing/services/api-mock.service';
import { DatacenterMockService } from '../../../testing/services/datacenter-mock.service';
import { ProjectMockService } from '../../../testing/services/project-mock.service';
import { AddNodeModalComponent } from './add-node-modal.component';

describe('AddNodeModalComponent', () => {
  let fixture: ComponentFixture<AddNodeModalComponent>;
  let component: AddNodeModalComponent;
  let activatedRoute: ActivatedRouteStub;
  let createClusterNodeSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'createClusterNode']);
    apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    createClusterNodeSpy = apiMock.createClusterNode.and.returnValue(asyncData(fakeDigitaloceanCreateNode()));

    TestBed.configureTestingModule({
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
        AddNodeModalComponent,
        AddNodeComponent,
        OpenstackAddNodeComponent,
        OpenstackOptionsComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        DigitaloceanOptionsComponent,
        HetznerAddNodeComponent,
        VSphereAddNodeComponent,
        VSphereOptionsComponent,
        AzureAddNodeComponent,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { cluster: fakeDigitaloceanCluster() } },
        { provide: MatDialogRef, useValue: {} },
        { provide: ApiService, useValue: apiMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        AddNodeService,
        WizardService,
        GoogleAnalyticsService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeModalComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.addNodeData = {
      node: fakeDigitaloceanCreateNode(),
      count: 1,
      valid: true,
    };
    component.addNodeData = nodeDataFake();

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = { clusterName: 'tbbfvttvs' };
    fixture.debugElement.injector.get(ApiService);
    fixture.detectChanges();
  });

  it('should create the add node modal cmp', () => {
    expect(component).toBeTruthy();
  });

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
