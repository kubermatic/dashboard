import { SharedModule } from '../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from './digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { OpenstackOptionsComponent } from './openstack-add-node/openstack-options/openstack-options.component';
import { fakeAWSCluster, fakeDigitaloceanCluster, fakeOpenstackCluster } from '../testing/fake-data/cluster.fake';
import { AddNodeService} from '../core/services/add-node/add-node.service';
import { ProjectService, WizardService, ApiService, DatacenterService } from '../core/services';
import { asyncData } from '../testing/services/api-mock.service';
import { fakeDigitaloceanSizes, fakeOpenstackFlavors } from '../testing/fake-data/addNodeModal.fake';
import { HetznerAddNodeComponent } from './hetzner-add-node/hetzner-add-node.component';
import { VSphereAddNodeComponent } from './vsphere-add-node/vsphere-add-node.component';
import { VSphereOptionsComponent } from './vsphere-add-node/vsphere-options/vsphere-options.component';
import { AzureAddNodeComponent } from './azure-add-node/azure-add-node.component';
import { nodeDataFake } from '../testing/fake-data/node.fake';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';
import Spy = jasmine.Spy;
import { ProjectMockService } from '../testing/services/project-mock.service';

describe('AddNodeComponent', () => {
  let fixture: ComponentFixture<AddNodeComponent>;
  let component: AddNodeComponent;
  let getDigitaloceanSizesSpy: Spy;
  let getDigitaloceanSizesForWizardSpy: Spy;
  let getOpenStackFlavorsSpy: Spy;
  let getOpenStackFlavorsForWizardSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes',
      'getDigitaloceanSizesForWizard', 'getOpenStackFlavors', 'getOpenStackFlavorsForWizard']);
    getDigitaloceanSizesSpy = apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    getDigitaloceanSizesForWizardSpy = apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    getOpenStackFlavorsSpy = apiMock.getOpenStackFlavors.and.returnValue(asyncData(fakeOpenstackFlavors()));
    getOpenStackFlavorsForWizardSpy = apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
      ],
      declarations: [
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
        AddNodeService,
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: ProjectService, useClass: ProjectMockService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeComponent);
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

    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).toBeNull();

    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).toBeNull();

    component.cluster = fakeOpenstackCluster();
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).toBeNull();
  });
});
