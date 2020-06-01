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
import {
  fakeAlibabaInstanceTypes,
  fakeAlibabaZones,
} from '../../testing/fake-data/alibaba.fake';
import {fakeAlibabaCluster} from '../../testing/fake-data/cluster.fake';
import {fakeAlibabaDatacenter} from '../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';

import {AlibabaNodeDataComponent} from './alibaba-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('AlibabaNodeDataComponent', () => {
  let fixture: ComponentFixture<AlibabaNodeDataComponent>;
  let component: AlibabaNodeDataComponent;
  let datacenterMock;
  let apiMock;

  beforeEach(async(() => {
    apiMock = {getAlibabaInstanceTypes: jest.fn(), getAlibabaZones: jest.fn()};
    apiMock.getAlibabaInstanceTypes.mockReturnValue(
      asyncData(fakeAlibabaInstanceTypes())
    );
    apiMock.getAlibabaZones.mockReturnValue(asyncData(fakeAlibabaZones()));
    datacenterMock = {getDatacenter: jest.fn()};
    datacenterMock.getDatacenter.mockReturnValue(
      asyncData(fakeAlibabaDatacenter())
    );

    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [AlibabaNodeDataComponent],
      providers: [
        NodeDataService,
        WizardService,
        {provide: ApiService, useValue: apiMock},
        {provide: DatacenterService, useValue: datacenterMock},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlibabaNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAlibabaCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    component.clusterId = '';
    component.cloudSpec.alibaba = {
      accessKeyID: '',
      accessKeySecret: '',
    };
    fixture.detectChanges();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });
});
