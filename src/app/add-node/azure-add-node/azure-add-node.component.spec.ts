import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { ApiService, DatacenterService } from '../../core/services';
import { fakeAzureCluster } from '../../testing/fake-data/cluster.fake';
import { AzureAddNodeComponent } from './azure-add-node.component';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { fakeAzureSizes } from '../../testing/fake-data/addNodeModal.fake';
import { fakeAzureDatacenter } from '../../testing/fake-data/datacenter.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule
];

describe('AzureAddNodeComponent', () => {
  let fixture: ComponentFixture<AzureAddNodeComponent>;
  let component: AzureAddNodeComponent;
  let getAzureSizesSpy: Spy;
  let getDatacenterSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getAzureSizes']);
    getAzureSizesSpy = apiMock.getAzureSizes.and.returnValue(asyncData(fakeAzureSizes));
    const datacenterMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
    getDatacenterSpy = datacenterMock.getDataCenter.and.returnValue(asyncData(fakeAzureDatacenter));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AzureAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useValue: datacenterMock }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAzureCluster.spec.cloud;
    component.nodeData = nodeDataFake;
    component.datacenter = fakeAzureDatacenter;
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
