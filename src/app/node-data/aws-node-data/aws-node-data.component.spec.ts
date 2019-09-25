import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
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
  let datacenterMock;
  let apiMock;

  beforeEach(async(() => {
    apiMock = jasmine.createSpyObj('ApiService', ['getAWSSubnets']);
    apiMock.getAWSSubnets.and.returnValue(asyncData(fakeAwsSubnets()));
    datacenterMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAWSCluster().spec.cloud;
    component.cloudSpec.aws.vpcId = 'test-vpc';
    component.nodeData = nodeDataFake();
    component.clusterId = '';
    component.cloudSpec.aws = {
      accessKeyId: '',
      secretAccessKey: '',
      vpcId: '',
      routeTableId: '',
      securityGroupID: '',
      instanceProfileName: '',
      roleARN: '',
    };
    fixture.detectChanges();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should fill _subnetMap correctly', () => {
    component.fillSubnetMap([]);
    expect(component.subnetAZ).toEqual([]);

    component.fillSubnetMap(fakeAwsSubnets());
    expect(component.subnetAZ).toEqual(['eu-central-1a', 'eu-central-1c', 'eu-central-1b']);
    expect(component.getSubnetToAZ('eu-central-1a')).toEqual([
      {
        name: '',
        id: 'subnet-2bff4f43',
        availability_zone: 'eu-central-1a',
        availability_zone_id: 'euc1-az2',
        ipv4cidr: '172.31.0.0/20',
        ipv6cidr: '',
        tags: [
          {key: 'kubernetes.io/cluster/m4q97kxmsw', value: ''}, {key: 'kubernetes.io/cluster/wpkzz5l8zx', value: ''},
          {key: 'kubernetes.io/cluster/6cjxnw7k8v', value: ''}
        ],
        state: 'available',
        available_ip_address_count: 4084,
        default: true
      },
      {
        name: '',
        id: 'subnet-3cee5e54',
        availability_zone: 'eu-central-1a',
        availability_zone_id: 'euc1-az2',
        ipv4cidr: '172.31.0.0/20',
        ipv6cidr: '',
        tags: [{key: 'kubernetes.io/cluster/m4q97kxmsw', value: ''}],
        state: 'available',
        available_ip_address_count: 4084,
        default: true
      }
    ]);

    expect(component.getSubnetToAZ('eu-central-1b')).toEqual([{
      name: '',
      id: 'subnet-06d1167c',
      availability_zone: 'eu-central-1b',
      availability_zone_id: 'euc1-az3',
      ipv4cidr: '172.31.16.0/20',
      ipv6cidr: '',
      tags:
          [{key: 'kubernetes.io/cluster/6tq9t4f2rs', value: ''}, {key: 'kubernetes.io/cluster/rtx6mhq77x', value: ''}],
      state: 'available',
      available_ip_address_count: 4090,
      default: true
    }]);

    expect(component.getSubnetToAZ('eu-central-1c')).toEqual([
      {
        name: '',
        id: 'subnet-f3427db9',
        availability_zone: 'eu-central-1c',
        availability_zone_id: 'euc1-az1',
        ipv4cidr: '172.31.32.0/20',
        ipv6cidr: '',
        tags: [{key: 'kubernetes.io/cluster/9gx49bqcg5', value: ''}],
        state: 'available',
        available_ip_address_count: 4090,
        default: true
      },
    ]);
  });
});
