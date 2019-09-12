import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeAwsSubnets} from '../../testing/fake-data/aws-subnets.fake';
import {fakeAWSCluster} from '../../testing/fake-data/cluster.fake';
import {fakeAWSDatacenter} from '../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';

import {AWSNodeDataComponent} from './aws-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('AWSNodeDataComponent', () => {
  let fixture: ComponentFixture<AWSNodeDataComponent>;
  let component: AWSNodeDataComponent;

  beforeEach(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getAWSSubnets']);
    apiMock.getAWSSubnets.and.returnValue(asyncData(fakeAwsSubnets()));
    const datacenterMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
    datacenterMock.getDataCenter.and.returnValue(asyncData(fakeAWSDatacenter()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AWSNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: DatacenterService, useValue: datacenterMock},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAWSCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since aws has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeTruthy();
  });
});
