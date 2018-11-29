import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {AddNodeService} from '../../core/services/add-node/add-node.service';
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
];

describe('AzureNodeDataComponent', () => {
  let fixture: ComponentFixture<AzureNodeDataComponent>;
  let component: AzureNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getAzureSizes', 'getAzureSizesForWizard']);
    apiMock.getAzureSizes.and.returnValue(asyncData(fakeAzureSizes()));
    apiMock.getAzureSizesForWizard.and.returnValue(asyncData(fakeAzureSizes()));
    const datacenterMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
    datacenterMock.getDataCenter.and.returnValue(asyncData(fakeAzureDatacenter()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AzureNodeDataComponent,
          ],
          providers: [
            AddNodeService,
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: DatacenterService, useValue: datacenterMock},
          ],
        })
        .compileComponents();
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
