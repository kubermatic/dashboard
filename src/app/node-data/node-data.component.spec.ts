import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';

import {CoreModule} from '../core/core.module';
import {ApiService, ClusterService, DatacenterService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {SharedModule} from '../shared/shared.module';
import {fakeDigitaloceanSizes, fakeOpenstackFlavors} from '../testing/fake-data/addNodeModal.fake';
import {fakeAwsSubnets} from '../testing/fake-data/aws-subnets.fake';
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
import {AWSNodeOptionsComponent} from './aws-node-data/aws-node-options/aws-node-options.component';
import {AzureNodeDataComponent} from './azure-node-data/azure-node-data.component';
import {AzureNodeOptionsComponent} from './azure-node-data/azure-node-options/azure-node-options.component';
import {DigitaloceanNodeDataComponent} from './digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanNodeOptionsComponent} from './digitalocean-node-data/digitalocean-node-options/digitalocean-node-options.component';
import {GCPNodeDataComponent} from './gcp-node-data/gcp-node-data.component';
import {GCPNodeOptionsComponent} from './gcp-node-data/gcp-node-options/gcp-node-options.component';
import {HetznerNodeDataComponent} from './hetzner-node-data/hetzner-node-data.component';
import {KubeVirtNodeDataComponent} from './kubevirt-add-node/kubevirt-node-data.component';
import {NodeDataOptionsComponent} from './node-data-options/node-data-options.component';
import {NodeDataComponent} from './node-data.component';
import {OpenstackNodeDataComponent} from './openstack-node-data/openstack-node-data.component';
import {OpenstackNodeOptionsComponent} from './openstack-node-data/openstack-node-options/openstack-node-options.component';
import {PacketNodeDataComponent} from './packet-node-data/packet-node-data.component';
import {PacketNodeOptionsComponent} from './packet-node-data/packet-node-options/packet-node-options.component';
import {VSphereNodeDataComponent} from './vsphere-add-node/vsphere-node-data.component';
import {VSphereNodeOptionsComponent} from './vsphere-add-node/vsphere-node-options/vsphere-node-options.component';

describe('NodeDataComponent', () => {
  let fixture: ComponentFixture<NodeDataComponent>;
  let component: NodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', [
      'getDigitaloceanSizes', 'getDigitaloceanSizesForWizard', 'getOpenStackFlavors', 'getOpenStackFlavorsForWizard',
      'nodeUpgrades', 'getAWSSubnets'
    ]);
    apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getOpenStackFlavors.and.returnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.nodeUpgrades.and.returnValue(asyncData(masterVersionsFake()));
    apiMock.getAWSSubnets.and.returnValue(asyncData(fakeAwsSubnets()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SharedModule,
            HttpClientModule,
            CoreModule,
          ],
          declarations: [
            NodeDataComponent,
            NodeDataOptionsComponent,
            OpenstackNodeDataComponent,
            OpenstackNodeOptionsComponent,
            AWSNodeDataComponent,
            AWSNodeOptionsComponent,
            DigitaloceanNodeDataComponent,
            DigitaloceanNodeOptionsComponent,
            HetznerNodeDataComponent,
            VSphereNodeDataComponent,
            VSphereNodeOptionsComponent,
            AzureNodeDataComponent,
            AzureNodeOptionsComponent,
            PacketNodeDataComponent,
            PacketNodeOptionsComponent,
            GCPNodeDataComponent,
            GCPNodeOptionsComponent,
            KubeVirtNodeDataComponent,
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
