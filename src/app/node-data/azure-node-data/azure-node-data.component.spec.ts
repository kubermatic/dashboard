import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  ApiService,
  DatacenterService,
  WizardService,
} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeAzureSizes} from '../../testing/fake-data/addNodeModal.fake';
import {fakeAzureCluster} from '../../testing/fake-data/cluster.fake';
import {fakeAzureDatacenter} from '../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {AzureNodeDataComponent} from './azure-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('AzureNodeDataComponent', () => {
  let fixture: ComponentFixture<AzureNodeDataComponent>;
  let component: AzureNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = {
      getAzureSizes: jest.fn(),
      getAzureSizesForWizard: jest.fn(),
    };
    apiMock.getAzureSizes.mockReturnValue(asyncData(fakeAzureSizes()));
    apiMock.getAzureSizesForWizard.mockReturnValue(asyncData(fakeAzureSizes()));
    const datacenterMock = {getDatacenter: jest.fn()};
    datacenterMock.getDatacenter.mockReturnValue(
      asyncData(fakeAzureDatacenter())
    );

    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [AzureNodeDataComponent],
      providers: [
        NodeDataService,
        WizardService,
        {provide: ApiService, useValue: apiMock},
        {provide: DatacenterService, useValue: datacenterMock},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAzureCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    component.datacenter = fakeAzureDatacenter();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
