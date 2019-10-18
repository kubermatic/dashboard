import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeAzureSizes} from '../../../testing/fake-data/addNodeModal.fake';
import {fakeAzureDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AzureNodeOptionsComponent} from './azure-node-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('AzureNodeOptionsComponent', () => {
  let fixture: ComponentFixture<AzureNodeOptionsComponent>;
  let component: AzureNodeOptionsComponent;

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
            AzureNodeOptionsComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: DatacenterService, useValue: datacenterMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureNodeOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
    component.datacenter = fakeAzureDatacenter();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
