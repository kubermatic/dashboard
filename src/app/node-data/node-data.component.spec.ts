import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';

import {ApiService, ClusterService, DatacenterService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {SharedModule} from '../shared/shared.module';
import {fakeDigitaloceanSizes, fakeOpenstackFlavors} from '../testing/fake-data/addNodeModal.fake';
import {fakeAwsZones} from '../testing/fake-data/availabilyZones.fake';
import {masterVersionsFake} from '../testing/fake-data/cluster-spec.fake';
import {fakeAWSCluster, fakeDigitaloceanCluster, fakeOpenstackCluster} from '../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../testing/fake-data/node.fake';
import {RouterStub} from '../testing/router-stubs';
import {asyncData} from '../testing/services/api-mock.service';
import {ClusterMockService} from '../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../testing/services/datacenter-mock.service';
import {ClusterNameGeneratorMock} from '../testing/services/name-generator-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';

import {AWSNodeDataComponent} from './aws-node-data/aws-node-data.component';
import {AzureNodeDataComponent} from './azure-node-data/azure-node-data.component';
import {DigitaloceanNodeDataComponent} from './digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanOptionsComponent} from './digitalocean-node-data/digitalocean-options/digitalocean-options.component';
import {GCPNodeDataComponent} from './gcp-node-data/gcp-node-data.component';
import {HetznerNodeDataComponent} from './hetzner-node-data/hetzner-node-data.component';
import {NodeDataComponent} from './node-data.component';
import {OpenstackNodeDataComponent} from './openstack-node-data/openstack-node-data.component';
import {OpenstackOptionsComponent} from './openstack-node-data/openstack-options/openstack-options.component';
import {PacketNodeDataComponent} from './packet-node-data/packet-node-data.component';
import {VSphereNodeDataComponent} from './vsphere-add-node/vsphere-node-data.component';
import {VSphereOptionsComponent} from './vsphere-add-node/vsphere-options/vsphere-options.component';

describe('NodeDataComponent', () => {
  let fixture: ComponentFixture<NodeDataComponent>;
  let component: NodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', [
      'getDigitaloceanSizes', 'getDigitaloceanSizesForWizard', 'getOpenStackFlavors', 'getOpenStackFlavorsForWizard',
      'nodeUpgrades', 'getAWSZones'
    ]);
    apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getOpenStackFlavors.and.returnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.nodeUpgrades.and.returnValue(asyncData(masterVersionsFake()));
    apiMock.getAWSZones.and.returnValue(asyncData(fakeAwsZones()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
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
            PacketNodeDataComponent,
            GCPNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            {provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDataComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render specific form by provider in cluster.spec.cloud', () => {
    fixture.detectChanges();
    const addNodeElement: HTMLElement = fixture.nativeElement;

    expect(addNodeElement.querySelector('kubermatic-aws-node-data')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-node-data')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-node-data')).toBeNull();

    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-node-data')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-node-data')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-node-data')).toBeNull();

    component.cluster = fakeOpenstackCluster();
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-openstack-node-data')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-node-data')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-node-data')).toBeNull();
  });
});
